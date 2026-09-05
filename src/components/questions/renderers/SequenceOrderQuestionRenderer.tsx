import React, { useMemo, useState } from 'react';
import { KaniQuestion } from '../../../integration/kani/contracts';
import { SupportedAnswer } from '../../../engine/questions/types';

type SequenceQuestion = Extract<KaniQuestion, { type: 'sequence_order' }>;

function initialOrder(question: SequenceQuestion): number[] {
  const natural = question.items.map((_, index) => index);
  const alreadyCorrect = natural.length === question.correctOrder.length && natural.every((value, index) => value === question.correctOrder[index]);
  return alreadyCorrect ? [...natural].reverse() : natural;
}

export const SequenceOrderQuestionRenderer: React.FC<{ question: SequenceQuestion; onSubmit: (answer: SupportedAnswer) => void }> = ({ question, onSubmit }) => {
  const initial = useMemo(() => initialOrder(question), [question]);
  const [order, setOrder] = useState<number[]>(initial);

  const move = (position: number, delta: -1 | 1) => {
    const target = position + delta;
    if (target < 0 || target >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      [next[position], next[target]] = [next[target], next[position]];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-purple-200">Put the items in the correct order.</p>
      <ol className="space-y-2" aria-label="Sequence items">
        {order.map((itemIndex, position) => (
          <li key={`${question.id}-${itemIndex}`} className="flex items-center gap-3 rounded-2xl border border-purple-300/25 bg-slate-900/70 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/50 text-sm font-black">{position + 1}</span>
            <span className="min-w-0 flex-1 font-semibold text-slate-100">{question.items[itemIndex]}</span>
            <div className="flex shrink-0 gap-1">
              <button type="button" aria-label={`Move ${question.items[itemIndex]} up`} disabled={position === 0} onClick={() => move(position, -1)} className="h-9 w-9 rounded-xl border border-slate-600 bg-slate-800 font-bold hover:bg-slate-700 disabled:opacity-30">↑</button>
              <button type="button" aria-label={`Move ${question.items[itemIndex]} down`} disabled={position === order.length - 1} onClick={() => move(position, 1)} className="h-9 w-9 rounded-xl border border-slate-600 bg-slate-800 font-bold hover:bg-slate-700 disabled:opacity-30">↓</button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => onSubmit(order)} className="rounded-full bg-purple-600 px-6 py-3 font-bold text-white transition hover:bg-purple-500">Submit order</button>
    </div>
  );
};
