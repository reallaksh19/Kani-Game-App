import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { QuestionSessionResult } from '../../engine/questions/types';
import { LocalAttemptStore } from '../../integration/kani/AttemptStore';
import { KaniCatalogPage, KaniQuestion, StudyHubPageDocument } from '../../integration/kani/contracts';
import { adaptStudyHubPageQuestions } from '../../integration/kani/StudyHubQuestionAdapter';
import { CanonicalQuestionHost } from '../questions/CanonicalQuestionHost';
import { ExternalActivityHost } from './ExternalActivityHost';

interface StudyHubPracticePanelProps {
  page: StudyHubPageDocument;
  pageMeta: KaniCatalogPage;
  onAttemptSaved?: () => void;
}

type ExternalActivity = Extract<KaniQuestion, { type: 'interactive_external' }>;

export const StudyHubPracticePanel: React.FC<StudyHubPracticePanelProps> = ({ page, pageMeta, onAttemptSaved }) => {
  const { activeStudent, settings } = useAppContext();
  const adapted = useMemo(() => adaptStudyHubPageQuestions(page, pageMeta), [page, pageMeta]);
  const externalActivities = useMemo(
    () => adapted.questions.filter((question): question is ExternalActivity => question.type === 'interactive_external'),
    [adapted.questions],
  );
  const practiceQuestions = useMemo(
    () => adapted.questions.filter((question) => question.type !== 'interactive_external'),
    [adapted.questions],
  );
  const attemptStore = useMemo(() => new LocalAttemptStore(), []);
  const [mode, setMode] = useState<'summary' | 'running' | 'result'>('summary');
  const [runId, setRunId] = useState(1);
  const [result, setResult] = useState<QuestionSessionResult | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const complete = async (nextResult: QuestionSessionResult) => {
    setResult(nextResult);
    setMode('result');
    setSaveState('saving');
    try {
      for (const attempt of nextResult.attempts) await attemptStore.recordAttempt(attempt);
      setSaveState('saved');
      onAttemptSaved?.();
    } catch {
      setSaveState('error');
    }
  };

  const restart = () => {
    setResult(null);
    setSaveState('idle');
    setRunId((value) => value + 1);
    setMode('running');
  };

  if (adapted.questions.length === 0 && adapted.unsupported.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
        This Study-Hub page has no structured practice questions or external activities. Lesson rendering remains in Study-Hub.
      </div>
    );
  }

  if (mode === 'running' && activeStudent && practiceQuestions.length > 0) {
    return (
      <div className="mt-6 flex justify-center">
        <CanonicalQuestionHost
          key={`${page.id}_${runId}`}
          questions={practiceQuestions}
          config={{ randomize: settings.randomize, sessionId: `studyhub_${page.id}_${activeStudent.id}_${runId}` }}
          context={{
            studentId: activeStudent.id,
            activityId: `studyhub:${page.id}`,
            activityType: pageMeta.activityType,
            sourceApp: 'study-hub',
            subjectId: pageMeta.subjectId,
            topicId: pageMeta.topicId,
            pageId: pageMeta.id,
          }}
          onComplete={(nextResult) => void complete(nextResult)}
          onCancel={() => setMode('summary')}
        />
      </div>
    );
  }

  if (mode === 'result' && result) {
    return (
      <section className="mt-6 rounded-3xl border border-emerald-300/25 bg-emerald-950/20 p-5">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Study-Hub → Kani practice complete</div>
        <h3 className="mt-1 text-2xl font-black">{result.correctCount} / {result.total} correct</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-slate-900/70 px-3 py-1.5">Accuracy {Math.round(result.accuracy * 100)}%</span>
          <span className="rounded-full bg-slate-900/70 px-3 py-1.5">{(result.totalResponseTimeMs / 1000).toFixed(1)}s</span>
          <span className="rounded-full bg-slate-900/70 px-3 py-1.5">Attempts {saveState === 'saved' ? 'saved' : saveState === 'saving' ? 'saving…' : saveState === 'error' ? 'save failed' : 'pending'}</span>
        </div>
        <div className="mt-4 space-y-2">
          {result.review.filter((item) => !item.correct).map((item) => (
            <div key={item.questionId} className="rounded-2xl border border-rose-300/20 bg-rose-950/20 p-3 text-sm">
              <div className="font-bold text-rose-100">Needs review: {item.prompt}</div>
              {item.explanation && <div className="mt-1 text-slate-300">{item.explanation}</div>}
            </div>
          ))}
          {result.correctCount === result.total && <div className="text-sm text-emerald-100">All supported questions were correct.</div>}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={restart} className="rounded-full bg-emerald-600 px-5 py-2.5 font-bold hover:bg-emerald-500">Practice again</button>
          <button onClick={() => setMode('summary')} className="rounded-full border border-slate-500 px-5 py-2.5 font-bold text-slate-200 hover:bg-slate-800">Back to page activities</button>
        </div>
      </section>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-3xl border border-cyan-300/25 bg-cyan-950/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Cross-app practice seam</div>
            <h3 className="mt-1 text-xl font-black">Practice this Study-Hub page in Kani</h3>
            <p className="mt-1 text-sm text-slate-300">
              {practiceQuestions.length} Kani question{practiceQuestions.length === 1 ? '' : 's'} · {externalActivities.length} external activit{externalActivities.length === 1 ? 'y' : 'ies'}.
              {' '}Kani keeps the active student, timing, review and attempt history.
            </p>
          </div>
          {practiceQuestions.length > 0 && (
            <button
              type="button"
              disabled={!activeStudent}
              onClick={() => setMode('running')}
              className="rounded-full bg-cyan-600 px-5 py-2.5 font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start question practice →
            </button>
          )}
        </div>

        {adapted.unsupported.length > 0 && (
          <details className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-950/20 p-3 text-sm">
            <summary className="cursor-pointer font-bold text-amber-100">{adapted.unsupported.length} question{adapted.unsupported.length === 1 ? '' : 's'} not enabled yet</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-100/80">
              {adapted.unsupported.map((issue, index) => <li key={`${issue.questionId || 'question'}_${index}`}>{issue.questionId ? `${issue.questionId}: ` : ''}{issue.reason}</li>)}
            </ul>
          </details>
        )}

        {!activeStudent && <div className="mt-3 text-sm text-rose-200">A stable Kani student profile is required to record question or external-activity attempts.</div>}
      </section>

      {externalActivities.map((activity) => (
        <ExternalActivityHost key={activity.id} activity={activity} pageMeta={pageMeta} onAttemptSaved={onAttemptSaved} />
      ))}
    </div>
  );
};
