import React, { useState } from 'react';
import { KaniQuestion } from '../../../integration/kani/contracts';
import { SupportedAnswer } from '../../../engine/questions/types';

type NumericQuestion = Extract<KaniQuestion, { type: 'numeric' }>;

export const NumericQuestionRenderer: React.FC<{ question: NumericQuestion; onSubmit: (answer: SupportedAnswer) => void }> = ({ question, onSubmit }) => {
  const [value, setValue] = useState('');
  const parsed = value.trim() === '' ? Number.NaN : Number(value);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (Number.isFinite(parsed)) onSubmit(parsed);
      }}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-purple-200">Enter a number{question.unit ? ` in ${question.unit}` : ''}.</span>
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-label="Numeric answer"
            className="min-w-0 flex-1 rounded-2xl border border-purple-300/30 bg-slate-900/70 px-4 py-3 text-lg font-semibold text-white outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-400/30"
          />
          {question.unit && <span className="shrink-0 font-bold text-purple-200">{question.unit}</span>}
        </div>
      </label>
      {question.tolerance > 0 && <p className="text-xs text-slate-400">Answers within ±{question.tolerance} are accepted.</p>}
      <button type="submit" disabled={!Number.isFinite(parsed)} className="rounded-full bg-purple-600 px-6 py-3 font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40">Submit answer</button>
    </form>
  );
};
