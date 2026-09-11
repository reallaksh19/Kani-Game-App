import React, { useEffect, useMemo, useState } from 'react';
import { CanonicalQuestionHost } from '../questions/CanonicalQuestionHost';
import { SpaceBackground } from '../shared/SpaceBackground';
import { useAppContext } from '../../contexts/AppContext';
import { QuestionSessionResult } from '../../engine/questions/types';
import { createCanonicalAttemptStore } from '../../integration/kani/createCanonicalAttemptStore';
import { getKaniIntegrationConfig } from '../../integration/kani/integrationConfig';
import { PrimaryMissionBundle, PrimaryMissionClient, PrimaryMissionError } from '../../integration/kani/PrimaryMissionClient';

interface PrimaryMissionPageProps {
  opaqueId: string;
  onExit: () => void;
}

type LoadState = 'loading' | 'ready' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function newSessionNonce(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function buildReturnUrl(baseUrl: string, opaqueId: string): string {
  const root = baseUrl.replace(/\/+$/, '');
  return `${root}/primary/return.html?mission=${encodeURIComponent(opaqueId)}`;
}

export const PrimaryMissionPage: React.FC<PrimaryMissionPageProps> = ({ opaqueId, onExit }) => {
  const { activeStudent } = useAppContext();
  const config = useMemo(() => getKaniIntegrationConfig(), []);
  const client = useMemo(() => new PrimaryMissionClient({ baseUrl: config.studyHubBaseUrl }), [config.studyHubBaseUrl]);
  const attemptStore = useMemo(() => createCanonicalAttemptStore(), []);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [bundle, setBundle] = useState<PrimaryMissionBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestionSessionResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [reloadKey, setReloadKey] = useState(0);
  const [sessionNonce, setSessionNonce] = useState(newSessionNonce);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    setLoadError(null);
    setBundle(null);
    setResult(null);
    setSaveState('idle');

    void client.loadByOpaqueId(opaqueId)
      .then((next) => {
        if (cancelled) return;
        setBundle(next);
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof PrimaryMissionError
          ? error.message
          : 'The learning mission could not be loaded.';
        setLoadError(message);
        setLoadState('error');
      });

    return () => { cancelled = true; };
  }, [client, opaqueId, reloadKey]);

  const retryLoad = () => {
    setSessionNonce(newSessionNonce());
    setReloadKey((value) => value + 1);
  };

  const complete = async (nextResult: QuestionSessionResult) => {
    setResult(nextResult);
    setSaveState('saving');
    try {
      for (const attempt of nextResult.attempts) await attemptStore.recordAttempt(attempt);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  if (!activeStudent) return null;

  const returnUrl = buildReturnUrl(config.studyHubBaseUrl, opaqueId);

  return (
    <SpaceBackground>
      <div className="min-h-full overflow-y-auto px-4 py-6 text-white">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              aria-label="Leave mission"
              className="h-11 w-11 rounded-full bg-slate-900/80 text-xl hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400"
            >
              ←
            </button>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Study-Hub → Kani learning mission</div>
              <h1 className="text-3xl font-black sm:text-4xl">Fraction Mission</h1>
              <p className="mt-1 text-sm text-slate-300">Mission code {opaqueId}. Your learner profile is attached only after launch.</p>
            </div>
          </div>

          {loadState === 'loading' && (
            <section className="rounded-3xl border border-cyan-300/30 bg-slate-950/80 p-8 text-center shadow-2xl">
              <div className="text-5xl">🛰️</div>
              <h2 className="mt-4 text-2xl font-black">Loading your fraction mission…</h2>
              <p className="mt-2 text-slate-300">Kani is checking the mission with Study-Hub.</p>
            </section>
          )}

          {loadState === 'error' && (
            <section className="rounded-3xl border border-amber-300/40 bg-slate-950/85 p-6 shadow-2xl sm:p-8">
              <div className="text-5xl">📡</div>
              <h2 className="mt-4 text-2xl font-black">Mission could not load yet</h2>
              <p className="mt-2 max-w-2xl text-slate-200">Keep this mission code: <strong className="text-cyan-200">{opaqueId}</strong>. Check your connection, then try again.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={retryLoad} className="rounded-full bg-cyan-600 px-6 py-3 font-black text-white hover:bg-cyan-500">Try again</button>
                <button type="button" onClick={onExit} className="rounded-full border border-slate-500 px-6 py-3 font-bold text-slate-200 hover:bg-slate-800">Back to Kani</button>
              </div>
              {loadError && (
                <details className="mt-5 text-xs text-slate-500">
                  <summary className="cursor-pointer">Technical details</summary>
                  <code className="mt-2 block whitespace-pre-wrap">{loadError}</code>
                </details>
              )}
            </section>
          )}

          {loadState === 'ready' && bundle && !result && (
            <>
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <MissionFact label="Questions" value={String(bundle.questions.length)} />
                <MissionFact label="Timer" value={bundle.mission.timerPolicy === 'OFF' ? 'Off' : bundle.mission.timerPolicy} />
                <MissionFact label="Finish means" value="Activity complete" />
              </div>
              <div className="flex justify-center">
                <CanonicalQuestionHost
                  key={`${bundle.mission.missionId}:${sessionNonce}`}
                  questions={bundle.questions}
                  config={{
                    randomize: false,
                    sessionId: `primary_${opaqueId}_${activeStudent.id}_${sessionNonce}`,
                  }}
                  context={{
                    studentId: activeStudent.id,
                    activityId: bundle.mission.missionId,
                    activityType: 'game',
                    sourceApp: 'game-app',
                    subjectId: bundle.questions[0]?.subjectId || 'mathematics',
                    topicId: bundle.questions[0]?.topicId,
                    pageId: bundle.questions[0]?.pageId,
                    primaryEvidence: {
                      semanticVersion: '1.0',
                      learningEpisodeId: bundle.mission.learningEpisodeId,
                      learningObjectIds: [...bundle.mission.learningObjectIds],
                    },
                  }}
                  onComplete={(nextResult) => void complete(nextResult)}
                  onCancel={onExit}
                />
              </div>
            </>
          )}

          {result && bundle && (
            <section className="rounded-3xl border border-emerald-300/35 bg-slate-950/85 p-6 shadow-2xl sm:p-8">
              <div className="text-6xl">🚀</div>
              <div className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Mission complete</div>
              <h2 className="mt-1 text-3xl font-black">Nice work finishing the fraction activity.</h2>
              <p className="mt-3 max-w-2xl text-slate-200">
                This is recent practice evidence, not a mastery label. You answered {result.correctCount} of {result.total} questions correctly in this activity.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MissionFact label="Attempts recorded" value={String(result.attempts.length)} />
                <MissionFact label="Evidence save" value={saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Saved locally / retry needed' : 'Pending'} />
                <MissionFact label="Next step" value="Independent return task" />
              </div>

              <div className="mt-7 rounded-2xl border border-cyan-300/30 bg-cyan-950/25 p-5">
                <div className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">Back to learning</div>
                <p className="mt-2 text-slate-100">Now show what you know outside the game. The return task uses a different question from the six game questions.</p>
                <a
                  href={returnUrl}
                  className="mt-4 inline-flex rounded-full bg-cyan-500 px-7 py-3 text-base font-black text-slate-950 hover:bg-cyan-400"
                >
                  Back to my fraction page →
                </a>
              </div>

              <button type="button" onClick={onExit} className="mt-5 text-sm font-semibold text-slate-400 underline decoration-slate-600 underline-offset-4 hover:text-white">Leave mission and go to Kani home</button>
            </section>
          )}

          <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-xs text-slate-400">
            Boundary: the QR/deep link carries only an opaque mission code. Kani binds the active learner at runtime and records immutable attempts. Game completion does not mean mastery.
          </div>
        </div>
      </div>
    </SpaceBackground>
  );
};

const MissionFact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 text-lg font-black text-white">{value}</div>
  </div>
);
