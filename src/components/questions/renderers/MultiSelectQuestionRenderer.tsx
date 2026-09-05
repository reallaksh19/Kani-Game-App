import React, { useState } from 'react';
import { KaniQuestion } from '../../../integration/kani/contracts';
import { SupportedAnswer } from '../../../engine/questions/types';

type MultiSelectQuestion = Extract<KaniQuestion, { type: 'multi_select' }>;

export const MultiSelectQuestionRenderer: React.FC<{ question: MultiSelectQuestion; onSubmit: (answer: SupportedAnswer) => void }> = ({ question, onSubmit }) => {
  const [selected, setSelected] = useState<number[]>([]);
  const toggle = (index: number) => setSelected((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index]);

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-purple-200">Select all that apply.</p>
      <div className="grid gap-3">
        {question.options.map((option, index) => {
          const active = selected.includes(index);
          return (
            <button
              key={`${question.id}-${index}`}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(index)}
              className={`rounded-2xl border px-4 py-3 text-left font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 ${active ? 'border-purple-300 bg-purple-600/40 text-white' : 'border-purple-300/30 bg-slate-900/70 text-slate-100 hover:border-purple-300'}`}
            >
              <span className="mr-3">{active ? '☑' : '☐'}</span>{option}
            </button>
          );
        })}
      </div>
      <button type="button" onClick={() => onSubmit(selected)} disabled={selected.length === 0} className="rounded-full bg-purple-600 px-6 py-3 font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40">Submit selections</button>
    </div>
  );
};
