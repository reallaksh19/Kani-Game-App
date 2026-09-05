import React, { useState } from 'react';
import { KaniQuestion } from '../../../integration/kani/contracts';
import { SupportedAnswer } from '../../../engine/questions/types';

type MatchQuestion = Extract<KaniQuestion, { type: 'match_following' }>;

export const MatchFollowingQuestionRenderer: React.FC<{ question: MatchQuestion; onSubmit: (answer: SupportedAnswer) => void }> = ({ question, onSubmit }) => {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const complete = question.leftItems.every((item) => Boolean(matches[item.id]));

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-purple-200">Match each item on the left with one item on the right.</p>
      <div className="space-y-3">
        {question.leftItems.map((left) => (
          <label key={left.id} className="grid gap-2 rounded-2xl border border-purple-300/25 bg-slate-900/70 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,1fr)] sm:items-center">
            <span className="font-semibold text-slate-100">{left.text}</span>
            <select
              value={matches[left.id] || ''}
              onChange={(event) => setMatches((current) => ({ ...current, [left.id]: event.target.value }))}
              aria-label={`Match for ${left.text}`}
              className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-400/30"
            >
              <option value="">Choose match…</option>
              {question.rightItems.map((right) => <option key={right.id} value={right.id}>{right.text}</option>)}
            </select>
          </label>
        ))}
      </div>
      <button type="button" disabled={!complete} onClick={() => onSubmit(matches)} className="rounded-full bg-purple-600 px-6 py-3 font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40">Submit matches</button>
    </div>
  );
};
