import React from 'react';
import { KaniQuestion } from '../../../integration/kani/contracts';
import { SupportedAnswer } from '../../../engine/questions/types';

type McqQuestion = Extract<KaniQuestion, { type: 'mcq' }>;

export const McqQuestionRenderer: React.FC<{ question: McqQuestion; onSubmit: (answer: SupportedAnswer) => void }> = ({ question, onSubmit }) => (
  <div className="grid gap-3">
    {question.options.map((option, index) => (
      <button
        key={`${question.id}-${index}`}
        type="button"
        onClick={() => onSubmit(index)}
        className="w-full rounded-2xl border border-purple-300/40 bg-slate-900/70 px-4 py-3 text-left font-semibold text-white transition hover:border-purple-300 hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400"
      >
        <span className="mr-2 text-purple-300">{String.fromCharCode(65 + index)}.</span>{option}
      </button>
    ))}
  </div>
);
