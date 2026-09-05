import React from 'react';
import { KaniQuestion } from '../../../integration/kani/contracts';
import { SupportedAnswer } from '../../../engine/questions/types';

type AssertionReasonQuestion = Extract<KaniQuestion, { type: 'assertion_reason' }>;

export const AssertionReasonQuestionRenderer: React.FC<{ question: AssertionReasonQuestion; onSubmit: (answer: SupportedAnswer) => void }> = ({ question, onSubmit }) => (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-cyan-300/25 bg-cyan-950/25 p-4">
        <div className="text-xs font-black uppercase tracking-wider text-cyan-300">Assertion</div>
        <div className="mt-2 font-semibold text-white">{question.assertion}</div>
      </div>
      <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-950/25 p-4">
        <div className="text-xs font-black uppercase tracking-wider text-fuchsia-300">Reason</div>
        <div className="mt-2 font-semibold text-white">{question.reason}</div>
      </div>
    </div>
    <p className="text-sm font-semibold text-purple-200">Choose the relationship that is correct.</p>
    <div className="grid gap-3">
      {question.options.map((option, index) => (
        <button
          key={`${question.id}-${index}`}
          type="button"
          onClick={() => onSubmit(index)}
          className="rounded-2xl border border-purple-300/30 bg-slate-900/70 px-4 py-3 text-left font-semibold text-slate-100 transition hover:border-purple-300 hover:bg-purple-950/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400"
        >
          <span className="mr-3 text-purple-300">{String.fromCharCode(65 + index)}.</span>{option}
        </button>
      ))}
    </div>
  </div>
);
