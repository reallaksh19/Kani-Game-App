import React, { useRef, useState } from 'react';
import { KaniQuestion } from '../../integration/kani/contracts';
import { QuestionSessionEngine } from '../../engine/questions/QuestionSessionEngine';
import { renderCanonicalQuestion } from '../../engine/questions/QuestionRendererRegistry';
import { QuestionSessionConfig, QuestionSessionContext, QuestionSessionResult, SupportedAnswer } from '../../engine/questions/types';

interface CanonicalQuestionHostProps {
  questions: readonly KaniQuestion[];
  config: QuestionSessionConfig;
  context: QuestionSessionContext;
  onComplete: (result: QuestionSessionResult) => void;
  onCancel?: () => void;
}

export const CanonicalQuestionHost: React.FC<CanonicalQuestionHostProps> = ({ questions, config, context, onComplete, onCancel }) => {
  const engineRef = useRef<QuestionSessionEngine | null>(null);
  if (!engineRef.current) engineRef.current = new QuestionSessionEngine({ questions, config });
  const engine = engineRef.current;
  const [revision, setRevision] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const question = engine.currentQuestion;
  const snapshot = engine.getSnapshot();

  const submit = (answer: SupportedAnswer) => {
    engine.submitAnswer(answer, hintsUsed);
    setHintsUsed(0);
    setShowHint(false);
    if (engine.completed) {
      onComplete(engine.buildResult(context));
      return;
    }
    setRevision((value) => value + 1);
  };

  if (!question) {
    return <div className="rounded-3xl border border-purple-300/30 bg-slate-900/80 p-8 text-center text-white">No supported questions are available in this session.</div>;
  }

  const prompt = 'prompt' in question && typeof question.prompt === 'string'
    ? question.prompt
    : question.type === 'assertion_reason'
      ? `${question.assertion} — ${question.reason}`
      : 'Complete the activity.';

  return (
    <section key={revision} className="w-full max-w-3xl rounded-3xl border border-purple-300/30 bg-slate-950/80 p-5 shadow-2xl backdrop-blur sm:p-7" aria-label="Canonical practice question">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">Kani Question Runtime · v1</div>
          <div className="mt-1 text-sm text-slate-300">Question {snapshot.currentIndex + 1} of {snapshot.questions.length}</div>
        </div>
        <div className="rounded-full border border-purple-300/30 bg-purple-900/30 px-3 py-1 text-xs font-bold uppercase text-purple-100">{question.difficulty}</div>
      </div>

      <h2 className="mb-5 text-xl font-bold leading-relaxed text-white sm:text-2xl">{prompt}</h2>

      {question.hint && (
        <div className="mb-4">
          {!showHint ? (
            <button
              type="button"
              onClick={() => { setShowHint(true); setHintsUsed((value) => value + 1); }}
              className="rounded-full border border-cyan-300/30 bg-cyan-950/40 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-900/50"
            >
              💡 Show hint
            </button>
          ) : (
            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-950/40 p-3 text-sm text-cyan-50">💡 {question.hint}</div>
          )}
        </div>
      )}

      {renderCanonicalQuestion(question, submit)}

      {onCancel && (
        <button type="button" onClick={onCancel} className="mt-6 text-sm font-semibold text-slate-400 underline decoration-slate-600 underline-offset-4 hover:text-white">End practice</button>
      )}
    </section>
  );
};
