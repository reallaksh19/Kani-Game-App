import React from 'react';
import { KaniQuestion } from '../../../integration/kani/contracts';
import { SupportedAnswer } from '../../../engine/questions/types';

type TrueFalseQuestion = Extract<KaniQuestion, { type: 'true_false' }>;

export const TrueFalseQuestionRenderer: React.FC<{ question: TrueFalseQuestion; onSubmit: (answer: SupportedAnswer) => void }> = ({ onSubmit }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <button type="button" onClick={() => onSubmit(true)} className="rounded-2xl border border-emerald-300/40 bg-emerald-950/50 px-5 py-4 font-bold text-emerald-100 transition hover:bg-emerald-900/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400">✓ True</button>
    <button type="button" onClick={() => onSubmit(false)} className="rounded-2xl border border-rose-300/40 bg-rose-950/50 px-5 py-4 font-bold text-rose-100 transition hover:bg-rose-900/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-400">✕ False</button>
  </div>
);
