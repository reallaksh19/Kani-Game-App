import React, { useMemo, useState } from 'react';
import { LeaderboardEntry, Settings } from '../../types';

interface LQChampHubPageProps {
  onBack: () => void;
  onSelectGame: (gameId: string) => void;
  leaderboard?: LeaderboardEntry[];
  totalStars: number;
  settings: Settings;
}

type HubTab = 'lots' | 'skills';

const LOTS = [
  {
    id: 'lq-lot-1',
    title: 'Thinksheet Lot 1',
    icon: '🏆',
    color: 'from-amber-500 via-orange-500 to-red-500',
    badge: 'Grade 4'
  },
  {
    id: 'lq-lot-2',
    title: 'Thinksheet Lot 2',
    icon: '⚡',
    color: 'from-purple-500 via-indigo-500 to-blue-500',
    badge: 'Grade 4'
  },
  {
    id: 'lq-lot-3',
    title: 'Thinksheet Lot 3',
    icon: '🧠',
    color: 'from-emerald-500 via-teal-500 to-cyan-500',
    badge: 'Grade 4'
  },
  {
    id: 'lq-lot-4',
    title: 'Thinksheet Lot 4',
    icon: '🎯',
    color: 'from-pink-500 via-rose-500 to-red-500',
    badge: 'Grade 4'
  },
  {
    id: 'lq-lot-5',
    title: 'Thinksheet Lot 5',
    icon: '🌟',
    color: 'from-blue-600 via-indigo-600 to-violet-700',
    badge: 'Grade 4'
  }
] as const;

const SKILLS = [
  {
    title: 'Numerical Ability',
    icon: '🔢',
    description: 'Number sense, arithmetic, fractions, time, measurement and patterns.'
  },
  {
    title: 'Verbal',
    icon: '📚',
    description: 'Vocabulary, grammar, sentence meaning, spelling and word relationships.'
  },
  {
    title: 'Memory and Concentration',
    icon: '🧭',
    description: 'Direction sense, ordered recall and multi-step attention challenges.'
  },
  {
    title: 'Analytical Thinking',
    icon: '🧩',
    description: 'Coding, classification, blood relations, ordering and deduction.'
  },
  {
    title: 'Visual Reasoning',
    icon: '👁️',
    description: 'Symbol patterns, visual sequences and structured shape reasoning.'
  }
] as const;

export const LQChampHubPage: React.FC<LQChampHubPageProps> = ({
  onBack,
  onSelectGame,
  leaderboard = [],
  totalStars
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('lots');

  const lqEntries = useMemo(
    () => leaderboard.filter(entry => entry.game.startsWith('lq-lot-')),
    [leaderboard]
  );

  const completedLots = useMemo(
    () => new Set(lqEntries.map(entry => entry.game)).size,
    [lqEntries]
  );

  const lqStars = lqEntries.reduce((sum, entry) => sum + entry.stars, 0);
  const proficiency = lqEntries.length === 0
    ? 0
    : Math.min(100, Math.round((lqStars / (lqEntries.length * 3)) * 100));

  return (
    <div className="min-h-screen bg-[#5c4fd6] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#4e41c4]/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <button
            onClick={onBack}
            className="rounded-full bg-white/10 px-4 py-2 font-bold transition hover:bg-white/20"
          >
            ← Home
          </button>
          <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-yellow-300">
            ⭐ {totalStars} Stars
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <section className="mb-6 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-sm font-extrabold uppercase tracking-widest text-purple-200">
                LQ Champ · Grade 4
              </p>
              <h1 className="text-3xl font-black sm:text-4xl">Olympiad Thinksheets</h1>
              <p className="mt-2 max-w-2xl text-sm text-purple-100">
                Five practice lots are ready. Every lot contains 20 questions:
                15 Medium and 5 Hard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-black/20 px-4 py-3">
                <div className="text-2xl font-black">5</div>
                <div className="text-xs text-purple-200">Lots Ready</div>
              </div>
              <div className="rounded-2xl bg-black/20 px-4 py-3">
                <div className="text-2xl font-black">100</div>
                <div className="text-xs text-purple-200">Questions</div>
              </div>
              <div className="rounded-2xl bg-black/20 px-4 py-3">
                <div className="text-2xl font-black">{proficiency}%</div>
                <div className="text-xs text-purple-200">Proficiency</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-100">
              {completedLots}/5 lots played
            </span>
            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-100">
              75 Medium questions
            </span>
            <span className="rounded-full bg-rose-400/20 px-3 py-1 text-rose-100">
              25 Hard questions
            </span>
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">Choose your practice view</h2>
            <p className="text-sm text-purple-200">
              Start with any lot, or review the five skill areas first.
            </p>
          </div>

          <div className="flex rounded-2xl border border-white/10 bg-black/25 p-1">
            <button
              onClick={() => setActiveTab('lots')}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === 'lots'
                  ? 'bg-white text-purple-900 shadow'
                  : 'text-purple-100 hover:text-white'
              }`}
            >
              5 Lots
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === 'skills'
                  ? 'bg-white text-purple-900 shadow'
                  : 'text-purple-100 hover:text-white'
              }`}
            >
              5 Skills
            </button>
          </div>
        </div>

        {activeTab === 'lots' ? (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LOTS.map((lot, index) => (
              <button
                key={lot.id}
                onClick={() => onSelectGame(lot.id)}
                className={`group rounded-3xl border-2 border-white/20 bg-gradient-to-br ${lot.color} p-6 text-left shadow-2xl transition hover:-translate-y-1 hover:scale-[1.02]`}
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <span className="text-5xl">{lot.icon}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-purple-800 shadow">
                    {lot.badge}
                  </span>
                </div>

                <div className="text-xs font-extrabold uppercase tracking-widest text-white/75">
                  Lot {index + 1} of 5
                </div>
                <h3 className="mt-1 text-xl font-black">{lot.title}</h3>
                <p className="mt-2 text-sm text-white/85">
                  20 questions · 15 Medium · 5 Hard
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4 text-sm font-extrabold">
                  <span>Start Thinksheet</span>
                  <span className="transition group-hover:translate-x-1">→</span>
                </div>
              </button>
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SKILLS.map(skill => (
              <div
                key={skill.title}
                className="rounded-3xl border border-white/15 bg-white p-5 text-gray-900 shadow-xl"
              >
                <div className="mb-3 text-4xl">{skill.icon}</div>
                <h3 className="text-lg font-black">{skill.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{skill.description}</p>
                <div className="mt-4 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">
                  Practised across all 5 lots
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default LQChampHubPage;
