import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { QuestionSessionResult } from '../../engine/questions/types';
import { createCanonicalAttemptStore } from '../../integration/kani/createCanonicalAttemptStore';
import {
  PATTERN_DIAGNOSTIC_ACTIVITY_ID,
  PatternDiagnosticEnvelope,
  fetchPatternDiagnostic,
} from '../../integration/kani/PatternDiagnosticClient';
import { buildPatternDiagnosticBridgeUrl } from '../../integration/kani/patternDiagnosticHandoff';
import { CanonicalQuestionHost } from '../questions/CanonicalQuestionHost';

interface PatternsDiagnosticPilotProps {
  studyHubBaseUrl: string;
  onAttemptSaved?: () => void;
}

type PilotMode = 'summary' | 'running' | 'result';

export const PatternsDiagnosticPilot: React.FC<PatternsDiagnosticPilotProps> = ({
  studyHubBaseUrl,
  onAttemptSaved,
}) => {
  const { activeStudent, settings } = useAppContext();
  const attemptStore = useMemo(() => createCanonicalAttemptStore(), []);
  const [diagnostic, setDiagnostic] = useState<PatternDiagnosticEnvelope | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<PilotMode>('summary');
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<QuestionSessionResult | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [bridgeUrl, setBridgeUrl] = useState('');

  const loadDiagnostic = async () => {
    setLoadState('loading');
    setError('');
    try {
      setDiagnostic(await fetchPatternDiagnostic(studyHubBaseUrl));
      setLoadState('ready');
    } catch (cause) {
      setDiagnostic(null);
      setLoadState('error');
      setError(cause instanceof Error ? cause.message : 'Patterns diagnostic could not be loaded.');
    }
  };

  useEffect(() => {
    void loadDiagnostic();
    // Base URL is stable for this Learn surface lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyHubBaseUrl]);

  const start = () => {
    if (!activeStudent || !diagnostic) return;
    setRunId((value) => value + 1);
    setResult(null);
    setBridgeUrl('');
    setSaveState('idle');
    setMode('running');
  };

  const complete = async (nextResult: QuestionSessionResult) => {
    setResult(nextResult);
    setMode('result');
    setSaveState('saving');
    setBridgeUrl('');
    try {
      for (const attempt of nextResult.attempts) await attemptStore.recordAttempt(attempt);
      const nextBridgeUrl = buildPatternDiagnosticBridgeUrl(studyHubBaseUrl, nextResult.attempts);
      setBridgeUrl(nextBridgeUrl);
      setSaveState('saved');
      onAttemptSaved?.();
    } catch {
      setSaveState('error');
    }
  };

  if (mode === 'running' && activeStudent && diagnostic) {
    return (
      <section className="mb-5 rounded-3xl border border-violet-300/30 bg-violet-950/25 p-5">
        <div className="mb-4">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Patterns learning pilot</div>
          <h2 className="mt-1 text-xl font-black">Diagnostic evidence run</h2>
          <p className="mt-1 text-sm text-violet-100/80">Complete the 26 probes in this run. Kani saves each canonical attempt locally under your active profile.</p>
        </div>
        <div className="flex justify-center">
          <CanonicalQuestionHost
            key={`patterns_diagnostic_${activeStudent.id}_${runId}`}
            questions={diagnostic.questions}
            config={{
              randomize: settings.randomize,
              sessionId: `patterns_diagnostic_${activeStudent.id}_${runId}`,
            }}
            context={{
              studentId: activeStudent.id,
              activityId: PATTERN_DIAGNOSTIC_ACTIVITY_ID,
              activityType: 'quiz',
              sourceApp: 'study-hub',
            }}
            onComplete={(nextResult) => void complete(nextResult)}
            onCancel={() => setMode('summary')}
          />
        </div>
      </section>
    );
  }

  if (mode === 'result' && result) {
    return (
      <section className="mb-5 rounded-3xl border border-emerald-300/30 bg-emerald-950/25 p-5">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Patterns diagnostic complete</div>
        <h2 className="mt-1 text-2xl font-black">{result.total} probes completed</h2>
        <p className="mt-2 max-w-3xl text-sm text-emerald-50/80">
          Study-Hub interprets the two probes for each skill separately, including hint use and mixed outcomes. Kani does not turn the total correct count into a placement label.
        </p>
        <div className="mt-3 text-sm text-slate-200">
          Attempts: {saveState === 'saved' ? 'saved locally' : saveState === 'saving' ? 'saving locally…' : saveState === 'error' ? 'save failed' : 'pending'}
        </div>
        {saveState === 'saved' && bridgeUrl && (
          <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-950/35 p-4">
            <div className="font-bold text-cyan-50">Your explainable learning bridge is ready.</div>
            <p className="mt-1 text-sm text-cyan-100/75">Only this completed run is handed to Study-Hub for its existing M003 → M001 placement logic.</p>
            <a
              href={bridgeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-full bg-cyan-600 px-5 py-2.5 font-bold text-white hover:bg-cyan-500"
            >
              Open my learning bridge ↗
            </a>
          </div>
        )}
        {saveState === 'error' && (
          <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-950/30 p-3 text-sm text-rose-100">
            The completed run could not be saved locally, so no bridge handoff was created. Your existing attempt history was not removed or rewritten.
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={start} disabled={!activeStudent || !diagnostic} className="rounded-full border border-emerald-300/40 px-5 py-2.5 font-bold text-emerald-100 hover:bg-emerald-900/40 disabled:opacity-40">Run diagnostic again</button>
          <button type="button" onClick={() => setMode('summary')} className="rounded-full border border-slate-500 px-5 py-2.5 font-bold text-slate-200 hover:bg-slate-800">Back to Learn</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-5 rounded-3xl border border-violet-300/30 bg-violet-950/25 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Local-first learner pilot</div>
          <h2 className="mt-1 text-2xl font-black">Patterns diagnostic → learning bridge</h2>
          <p className="mt-2 text-sm text-violet-100/80">
            Run 26 short canonical probes in Kani, save the attempts locally to your stable profile, then ask Study-Hub to explain the prerequisite-safe next steps from that run.
          </p>
          <p className="mt-2 text-xs text-violet-200/60">No cloud account, Worksheet source, or Practice rollout is required for this pilot.</p>
        </div>
        <button
          type="button"
          onClick={start}
          disabled={!activeStudent || loadState !== 'ready' || !diagnostic}
          className="rounded-full bg-violet-600 px-5 py-2.5 font-bold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Patterns diagnostic →
        </button>
      </div>

      {!activeStudent && <div className="mt-4 text-sm text-rose-200">Choose a stable Kani student profile before starting the diagnostic.</div>}
      {loadState === 'loading' && <div className="mt-4 text-sm text-violet-100/70">Loading the canonical Study-Hub diagnostic bank…</div>}
      {loadState === 'error' && (
        <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-950/30 p-3 text-sm text-amber-100">
          {error}
          <button type="button" onClick={() => void loadDiagnostic()} className="ml-3 font-bold underline">Retry</button>
        </div>
      )}
      {loadState === 'ready' && diagnostic && (
        <div className="mt-4 text-xs text-violet-100/60">Loaded {diagnostic.questions.length} canonical probes · activity {diagnostic.activityId}</div>
      )}
    </section>
  );
};
