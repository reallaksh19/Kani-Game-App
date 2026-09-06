import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { LocalAttemptStore } from '../../integration/kani/AttemptStore';
import {
  acceptKaniActivityEvent,
  completionMessageToAttempt,
  createLaunchMessage,
  normalizeAllowedOrigins,
  postKaniActivityMessage,
} from '../../integration/kani/activityBridge';
import { KaniCatalogPage, KaniQuestion } from '../../integration/kani/contracts';
import { getKaniIntegrationConfig } from '../../integration/kani/integrationConfig';
import { resolveStudyHubLearnerUrl } from '../../integration/kani/StudyHubContentClient';

type ExternalActivity = Extract<KaniQuestion, { type: 'interactive_external' }>;
type HostStatus = 'idle' | 'waiting' | 'ready' | 'running' | 'completed' | 'cancelled' | 'error';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ExternalActivityHostProps {
  activity: ExternalActivity;
  pageMeta: KaniCatalogPage;
  onAttemptSaved?: () => void;
}

function makeLaunchId(): string {
  if (globalThis.crypto?.randomUUID) return `launch_${globalThis.crypto.randomUUID()}`;
  return `launch_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const ExternalActivityHost: React.FC<ExternalActivityHostProps> = ({ activity, pageMeta, onAttemptSaved }) => {
  const { activeStudent } = useAppContext();
  const config = useMemo(() => getKaniIntegrationConfig(), []);
  const attemptStore = useMemo(() => new LocalAttemptStore(), []);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [launchId, setLaunchId] = useState<string | null>(null);
  const [status, setStatus] = useState<HostStatus>('idle');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ score?: number; accuracy?: number; durationSeconds?: number } | null>(null);

  const target = useMemo(() => {
    try {
      const url = resolveStudyHubLearnerUrl(config.studyHubBaseUrl, activity.externalRef.launchUrl);
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { url: '', origin: '', error: 'External activities must use an HTTP(S) URL.' };
      }
      const allowed = normalizeAllowedOrigins(config.allowedStudyHubOrigins);
      if (!allowed.includes(parsed.origin)) {
        return { url, origin: parsed.origin, error: `Activity origin ${parsed.origin} is not in the Kani allowlist.` };
      }
      if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
        return {
          url,
          origin: parsed.origin,
          error: 'Embedded activities must be served from an isolated origin. Same-origin iframes are not launched because they could access Kani learner storage.',
        };
      }
      return { url, origin: parsed.origin, error: '' };
    } catch {
      return { url: '', origin: '', error: 'The external activity launch URL is invalid.' };
    }
  }, [activity.externalRef.launchUrl, config.allowedStudyHubOrigins, config.studyHubBaseUrl]);

  const endHostSession = (nextStatus: HostStatus, nextMessage = '') => {
    setLaunchId(null);
    setStatus(nextStatus);
    setMessage(nextMessage);
  };

  useEffect(() => {
    if (!launchId || !activeStudent || !target.origin) return undefined;

    const receive = (event: MessageEvent) => {
      const sourceWindow = iframeRef.current?.contentWindow || null;
      if (!sourceWindow) return;
      const accepted = acceptKaniActivityEvent({
        event,
        allowedOrigins: config.allowedStudyHubOrigins,
        expectedSource: sourceWindow,
        launchId,
        activityId: activity.externalRef.activityId,
        studentId: activeStudent.id,
      });
      if (!accepted.accepted || !accepted.message) return;

      const incoming = accepted.message;
      if (incoming.type === 'kani.activity.ready') {
        setStatus('ready');
        const launch = createLaunchMessage({
          launchId,
          activityId: activity.externalRef.activityId,
          studentId: activeStudent.id,
          activityType: pageMeta.activityType,
          subjectId: pageMeta.subjectId,
          topicId: pageMeta.topicId,
          pageId: pageMeta.id,
          skillIds: activity.skillIds,
          difficulty: activity.difficulty,
        });
        postKaniActivityMessage(sourceWindow, target.origin, launch);
        return;
      }

      if (incoming.type === 'kani.activity.started') {
        setStatus('running');
        return;
      }

      if (incoming.type === 'kani.activity.completed') {
        const completed = incoming;
        setResult({
          ...(typeof completed.payload.score === 'number' ? { score: completed.payload.score } : {}),
          ...(typeof completed.payload.accuracy === 'number' ? { accuracy: completed.payload.accuracy } : {}),
          ...(typeof completed.payload.durationSeconds === 'number' ? { durationSeconds: completed.payload.durationSeconds } : {}),
        });
        setSaveStatus('saving');
        const attempt = completionMessageToAttempt(completed, {
          sourceApp: 'study-hub',
          subjectId: pageMeta.subjectId,
          topicId: pageMeta.topicId,
          pageId: pageMeta.id,
        });
        void attemptStore.recordAttempt(attempt)
          .then(() => {
            setSaveStatus('saved');
            onAttemptSaved?.();
          })
          .catch(() => setSaveStatus('error'));
        endHostSession('completed');
        return;
      }

      if (incoming.type === 'kani.activity.cancelled') {
        endHostSession('cancelled', 'The activity ended without a completion result.');
        return;
      }

      if (incoming.type === 'kani.activity.error') {
        endHostSession('error', `${incoming.payload.code}: ${incoming.payload.message}`);
      }
    };

    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [
    activeStudent,
    activity.difficulty,
    activity.externalRef.activityId,
    activity.skillIds,
    attemptStore,
    config.allowedStudyHubOrigins,
    launchId,
    onAttemptSaved,
    pageMeta.activityType,
    pageMeta.id,
    pageMeta.subjectId,
    pageMeta.topicId,
    target.origin,
  ]);

  const start = () => {
    if (!activeStudent || target.error) return;
    setResult(null);
    setSaveStatus('idle');
    setMessage('');
    setStatus('waiting');
    setLaunchId(makeLaunchId());
  };

  const stop = () => endHostSession('cancelled', 'Activity closed in Kani.');
  const title = activity.prompt || 'Interactive activity';

  return (
    <section className="rounded-3xl border border-violet-300/25 bg-violet-950/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Validated external activity</div>
          <h4 className="mt-1 text-lg font-black text-white">{title}</h4>
          <p className="mt-1 text-sm text-slate-300">Kani supplies the active student through <code>kani-activity-v1</code> and saves only validated completion evidence.</p>
        </div>
        {!launchId && status !== 'completed' && (
          <button
            type="button"
            onClick={start}
            disabled={!activeStudent || !!target.error}
            className="rounded-full bg-violet-600 px-5 py-2.5 font-bold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Launch activity →
          </button>
        )}
      </div>

      {!activeStudent && <div className="mt-3 text-sm text-rose-200">Select a Kani student before launching this activity.</div>}
      {target.error && <div className="mt-3 rounded-2xl border border-amber-300/25 bg-amber-950/25 p-3 text-sm text-amber-100">{target.error}</div>}

      {launchId && (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-violet-100">
              {status === 'waiting' ? 'Waiting for activity…' : status === 'ready' ? 'Launching…' : 'Activity running'}
            </span>
            <button type="button" onClick={stop} className="rounded-full border border-slate-500 px-4 py-2 font-bold text-slate-200 hover:bg-slate-800">Close activity</button>
          </div>
          <iframe
            ref={iframeRef}
            src={target.url}
            title={title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="fullscreen"
            className="h-[520px] w-full rounded-2xl border border-violet-300/20 bg-white"
          />
          <p className="mt-2 text-xs text-slate-500">Only messages from the configured origin, this iframe window, this launch ID, activity ID and active student are accepted.</p>
        </div>
      )}

      {status === 'completed' && result && (
        <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-950/25 p-4 text-sm text-emerald-50">
          <div className="font-bold">Activity complete</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {typeof result.score === 'number' && <span className="rounded-full bg-slate-900/60 px-3 py-1">Score {result.score}</span>}
            {typeof result.accuracy === 'number' && <span className="rounded-full bg-slate-900/60 px-3 py-1">Accuracy {Math.round(result.accuracy * 100)}%</span>}
            {typeof result.durationSeconds === 'number' && <span className="rounded-full bg-slate-900/60 px-3 py-1">{result.durationSeconds.toFixed(1)}s</span>}
            <span className="rounded-full bg-slate-900/60 px-3 py-1">Attempt {saveStatus === 'saved' ? 'saved' : saveStatus === 'saving' ? 'saving…' : saveStatus === 'error' ? 'save failed' : 'pending'}</span>
          </div>
          <button type="button" onClick={start} disabled={!activeStudent || !!target.error} className="mt-3 rounded-full bg-emerald-600 px-4 py-2 font-bold hover:bg-emerald-500 disabled:opacity-40">Run again</button>
        </div>
      )}

      {(status === 'cancelled' || status === 'error') && message && (
        <div className={`mt-4 rounded-2xl border p-3 text-sm ${status === 'error' ? 'border-rose-300/25 bg-rose-950/25 text-rose-100' : 'border-slate-600 bg-slate-900/60 text-slate-300'}`}>
          {message}
        </div>
      )}
    </section>
  );
};
