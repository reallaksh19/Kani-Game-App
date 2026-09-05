import React, { useState } from 'react';
import { KaniQuestion } from '../../../integration/kani/contracts';
import { SupportedAnswer } from '../../../engine/questions/types';

type TextQuestion = Extract<KaniQuestion, { type: 'short_answer' | 'fill_in_blank' }>;

export const TextQuestionRenderer: React.FC<{ question: TextQuestion; onSubmit: (answer: SupportedAnswer) => void }> = ({ question, onSubmit }) => {
  const [value, setValue] = useState('');
  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-purple-200" htmlFor={`answer-${question.id}`}>Your answer</label>
      <input
        id={`answer-${question.id}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && submit()}
        autoComplete="off"
        className="w-full rounded-2xl border border-purple-300/40 bg-slate-950/70 px-4 py-3 text-lg text-white outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-400/30"
      />
      <button type="button" onClick={submit} disabled={!value.trim()} className="rounded-full bg-purple-600 px-6 py-3 font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40">Submit answer</button>
    </div>
  );
};
