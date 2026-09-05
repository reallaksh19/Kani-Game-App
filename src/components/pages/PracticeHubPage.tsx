import React, { useMemo, useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { CanonicalQuestionHost } from '../questions/CanonicalQuestionHost';
import { useAppContext } from '../../contexts/AppContext';
import { LocalAttemptStore } from '../../integration/kani/AttemptStore';
import { getKaniIntegrationConfig } from '../../integration/kani/integrationConfig';
import { WORKSHEET_CANONICAL_FIXTURE } from '../../integration/kani/fixtures/worksheetCanonicalFixture';
import { QuestionSessionResult } from '../../engine/questions/types';

interface PracticeHubPageProps {
  onBack: () => void;
}

export const PracticeHubPage: React.FC<PracticeHubPageProps> = ({ onBack }) => {
  const { activeStudent, settings } = useAppContext();
  const config = useMemo(() => getKaniIntegrationConfig(), []);
  const attemptStore = useMemo(() => new LocalAttemptStore(), []);
  const [runId, setRunId] = useState(1);
  const [result, setResult] = useState<QuestionSessionResult | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  const restart = () => {
    setResult(null);
    setSaveState('idle');
    setRunId((value) => value + 1);
  };

  return (
    <SpaceBackground>
      <div className="min-h-full overflow-y-auto px-4 py-6 text-white">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <button onClick={onBack} aria-label="Back to home" className="h-11 w-11 rounded-full bg-slate-900/80 text-xl hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400">←</button>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">Game App · Learner Runtime Plane</div>
              <h1 className="text-3xl font-black sm:text-4xl">📝 Practice</h1>
              <p className="mt-1 text-sm text-slate-300">Canonical Worksheet App fixture running through the shared Kani QuestionSessionEngine.</p>
            </div>
          </div>

          {!config.integrationPracticeEnabled && (
            <div className="mb-5 rounded-2xl border border-amber-400/40 bg-amber-950/40 p-4 text-amber-100">
              Practice integration is disabled by feature flag. This route is an engineering placeholder and remains hidden from normal navigation until explicitly enabled.
            </div>
          )}

          {!activeStudent ? (
            <div className="rounded-3xl border border-rose-400/40 bg-rose-950/40 p-6 text-rose-100">A stable Kani student profile is required before canonical attempts can be recorded.</div>
          ) : result ? (
            <section className="rounded-3xl border border-purple-300/30 bg-slate-950/80 p-5 shadow-2xl sm:p-7">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">Canonical session result</div>
              <h2 className="mt-1 text-3xl font-black">{result.correctCount} / {result.total} correct</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Accuracy" value={`${Math.round(result.accuracy * 100)}%`} />
                <Metric label="Attempts" value={String(result.attempts.length)} />
                <Metric label="Time" value={`${(result.totalResponseTimeMs / 1000).toFixed(1)}s`} />
                <Metric label="Store" value={saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Error' : 'Pending'} />
              </div>

              <div className="mt-6 space-y-3">
                {result.review.map((item, index) => (
                  <details key={item.questionId} open={!item.correct} className={`rounded-2xl border p-4 ${item.correct ? 'border-emerald-400/25 bg-emerald-950/20' : 'border-rose-400/30 bg-rose-950/25'}`}>
                    <summary className="cursor-pointer font-bold">
                      {item.correct ? '✓' : '✕'} {index + 1}. {item.prompt}
                    </summary>
                    <div className="mt-3 space-y-2 text-sm text-slate-200">
                      <div>Your answer: <code className="text-purple-200">{JSON.stringify(item.selectedAnswer)}</code></div>
                      <div>Correct answer: <code className="text-emerald-200">{JSON.stringify(item.correctAnswer)}</code></div>
                      <div>Response time: {(item.responseTimeMs / 1000).toFixed(1)}s · Hints: {item.hintsUsed}</div>
                      {item.explanation && <div className="rounded-xl bg-slate-900/60 p-3 text-slate-200">{item.explanation}</div>}
                    </div>
                  </details>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={restart} className="rounded-full bg-purple-600 px-6 py-3 font-bold text-white hover:bg-purple-500">Practice again</button>
                <button onClick={onBack} className="rounded-full border border-slate-500 px-6 py-3 font-bold text-slate-200 hover:bg-slate-800">Back to Kani</button>
              </div>
            </section>
          ) : (
            <div className="flex justify-center">
              <CanonicalQuestionHost
                key={runId}
                questions={WORKSHEET_CANONICAL_FIXTURE}
                config={{ randomize: settings.randomize, sessionId: `worksheet_fixture_${activeStudent.id}_${runId}` }}
                context={{
                  studentId: activeStudent.id,
                  activityId: 'worksheet_integration_demo',
                  activityType: 'worksheet',
                  sourceApp: 'worksheet-app',
                  subjectId: 'mathematics',
                  topicId: 'worksheet-integration-demo',
                }}
                onComplete={(nextResult) => void complete(nextResult)}
                onCancel={onBack}
              />
            </div>
          )}

          <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-xs text-slate-400">
            Boundary proof: Worksheet App supplies canonical content; Game App owns student identity, Randomise behavior, runtime, timing, review and attempt persistence. No Worksheet App profile or score store is used.
          </div>
        </div>
      </div>
    </SpaceBackground>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 text-xl font-black text-white">{value}</div>
  </div>
);
