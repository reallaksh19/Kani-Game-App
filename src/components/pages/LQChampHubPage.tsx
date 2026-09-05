import React from 'react';
import { Settings, LeaderboardEntry } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { ALL_BADGES, calculateSkillLevel } from '../../utils/playerStats';

interface LQChampHubPageProps {
  onBack: () => void;
  onSelectGame: (gameId: string) => void;
  totalStars: number;
  settings: Settings;
  leaderboard?: LeaderboardEntry[];
}

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

const SKILLS_CONFIG = [
  {
    key: 'Numerical Ability',
    title: 'Numerical Ability',
    icon: '🔢',
    description: 'Number sense, arithmetic, patterns, riddles and mathematical reasoning.'
  },
  {
    key: 'Verbal',
    title: 'Verbal',
    icon: '📚',
    description: 'Vocabulary, idioms, grammar, homophones and word deduction.'
  },
  {
    key: 'Memory and Concentration',
    title: 'Memory and Concentration',
    icon: '🧭',
    description: 'Direction sense, spatial orientation and calendar arithmetic.'
  },
  {
    key: 'Analytical Thinking',
    title: 'Analytical Thinking',
    icon: '🧩',
    description: 'Coding-decoding, blood relations, deductive ordering and puzzles.'
  },
  {
    key: 'Visual Reasoning',
    title: 'Visual Reasoning',
    icon: '👁️',
    description: 'Hidden figures, geometric polygons and shape transformations.'
  }
] as const;

export const LQChampHubPage: React.FC<LQChampHubPageProps> = ({
  onBack,
  onSelectGame,
  totalStars
}) => {
  const { playerStats } = useAppContext();

  const totalAttempted = Object.values(playerStats.skillStats).reduce((sum, s) => sum + s.attempted, 0);
  const totalCorrect = Object.values(playerStats.skillStats).reduce((sum, s) => sum + s.correct, 0);
  const overallProficiency = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const completedLotsCount = Object.values(playerStats.lotProgress).filter(l => l.completed).length;

  return (
    <div className="min-h-screen bg-[#5c4fd6] text-white pb-20">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#4e41c4]/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <button
            onClick={onBack}
            className="rounded-full bg-white/10 px-4 py-2 font-bold transition hover:bg-white/20 cursor-pointer flex items-center gap-2 text-sm"
          >
            <span>←</span> Home
          </button>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-yellow-300">
              ⭐ {playerStats.totalStars || totalStars} Stars
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 space-y-10">
        {/* Top Hero Card (LogIQids Style) */}
        <section className="rounded-3xl border border-white/20 bg-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-widest bg-amber-400 text-gray-950 px-3 py-1 rounded-full">
                  Grade 4
                </span>
                <span className="text-xs font-bold text-purple-200">LogIQids Champ Hub</span>
              </div>
              <h1 className="text-3xl font-black sm:text-4xl tracking-tight">Olympiad Thinksheets</h1>
              <p className="mt-2 max-w-xl text-sm text-purple-100 leading-relaxed">
                Solve the 5 Olympiad Thinksheets to level up your reasoning skills from Beginner to Master!
              </p>
            </div>

            {/* Overall Proficiency Gauge (as seen in LogIQids UI) */}
            <div className="flex items-center gap-4 bg-black/25 p-4 sm:p-5 rounded-2xl border border-white/10">
              <div className="w-16 h-16 rounded-full border-4 border-amber-400 flex items-center justify-center bg-amber-400/20 shadow-inner">
                <span className="text-xl font-black text-amber-300">{overallProficiency}%</span>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-purple-200">Overall Proficiency</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {completedLotsCount} of 5 Thinksheets Solved
                </div>
                <div className="text-[11px] text-purple-300 mt-1">
                  {playerStats.unlockedBadgeIds?.length || 0} of {ALL_BADGES.length} Badges Earned
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: The 5 Thinksheet Lots (Main Playable Units) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <span>📄</span> 5 Thinksheet Lots
              </h2>
              <p className="text-xs sm:text-sm text-purple-200">
                Each Thinksheet contains 20 questions (15 Medium, 5 Hard) testing all 5 core skills.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LOTS.map((lot, index) => {
              const progress = playerStats.lotProgress[lot.id];
              const isCompleted = progress?.completed;

              return (
                <button
                  key={lot.id}
                  onClick={() => onSelectGame(lot.id)}
                  className={`group rounded-3xl border-2 border-white/20 bg-gradient-to-br ${lot.color} p-6 text-left shadow-2xl transition hover:-translate-y-1 hover:scale-[1.02] cursor-pointer relative overflow-hidden flex flex-col justify-between`}
                >
                  <div>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="text-5xl drop-shadow-md">{lot.icon}</span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-purple-900 shadow">
                        Lot {index + 1}
                      </span>
                    </div>

                    <div className="text-xs font-extrabold uppercase tracking-widest text-white/80">
                      Thinksheet {index + 1} of 5
                    </div>
                    <h3 className="mt-1 text-xl font-black">{lot.title}</h3>
                    <p className="mt-1.5 text-xs text-white/90 font-medium">
                      20 Questions · 15 Medium · 5 Hard
                    </p>

                    <div className="mt-3 text-[11px] font-bold text-white/80 flex flex-wrap gap-1">
                      <span>Covers: Numerical, Verbal, Analytical, Memory & Visual</span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-white/20 pt-4 flex items-center justify-between">
                    {isCompleted ? (
                      <div className="flex items-center gap-2 text-xs font-extrabold bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-400/40 text-emerald-200">
                        <span>✓ Solved</span>
                        <span>· Best: {progress.bestScore}/20</span>
                      </div>
                    ) : (
                      <span className="text-xs font-black uppercase tracking-wider text-amber-200 flex items-center gap-1">
                        <span>Play Thinksheet</span>
                        <span className="transition group-hover:translate-x-1">→</span>
                      </span>
                    )}
                    <span className="text-lg">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: LogIQids Skill Mastery Ladders (Matching Screenshot worksheet/topics) */}
        <section className="bg-white/10 p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span>🎯</span> Skill Mastery Ladders
            </h2>
            <p className="text-xs sm:text-sm text-purple-200">
              Each question you answer across the 5 lots increases your skill ranks from LV1 Beginner to LV5 Master.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SKILLS_CONFIG.map(skill => {
              const stat = playerStats.skillStats[skill.key] || { attempted: 0, correct: 0 };
              const { level, levelTitle, progressPercent } = calculateSkillLevel(stat.correct);

              return (
                <div
                  key={skill.key}
                  className="rounded-3xl border border-purple-100 bg-white p-5 text-gray-900 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Top Skill Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{skill.icon}</span>
                        <div>
                          <h3 className="text-base font-black text-purple-950">{skill.title}</h3>
                          <div className="text-[11px] font-bold text-gray-500">
                            Solved: <strong className="text-indigo-600 font-extrabold">{stat.correct}</strong>
                            {' · '}
                            Accuracy: {stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-4 leading-relaxed font-medium">
                      {skill.description}
                    </p>
                  </div>

                  <div>
                    {/* Level Pill Badge (LogIQids Style) */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-3 py-0.5 rounded-full">
                        LEVEL {level} {levelTitle}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        {stat.correct} questions right
                      </span>
                    </div>

                    {/* Checkpoint Ladder Progress Bar (LV1 to LV5) */}
                    <div className="relative pt-1 pb-4">
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 transition-all duration-700 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(8, progressPercent))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-extrabold text-gray-400 mt-1.5 px-0.5">
                        <span className={level >= 1 ? 'text-indigo-600 font-black' : ''}>LV1</span>
                        <span className={level >= 2 ? 'text-indigo-600 font-black' : ''}>LV2</span>
                        <span className={level >= 3 ? 'text-indigo-600 font-black' : ''}>LV3</span>
                        <span className={level >= 4 ? 'text-indigo-600 font-black' : ''}>LV4</span>
                        <span className={level >= 5 ? 'text-emerald-600 font-black' : ''}>LV5</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Pilot Trophies & Badges */}
        <section className="bg-white/10 p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <span>🏆</span> Pilot Badges & Trophies
              </h2>
              <p className="text-xs sm:text-sm text-purple-200">
                Unlock badges by solving lots, hitting answer streaks, and mastering skills!
              </p>
            </div>
            <div className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black px-4 py-2 rounded-2xl">
              {playerStats.unlockedBadgeIds?.length || 0} / {ALL_BADGES.length} Unlocked
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_BADGES.map(badge => {
              const isUnlocked = playerStats.unlockedBadgeIds?.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-white text-gray-900 border-amber-300 shadow-lg'
                      : 'bg-black/20 text-white/60 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-4xl ${isUnlocked ? 'filter-none scale-110 transition-transform' : 'grayscale opacity-50'}`}>
                      {badge.icon}
                    </span>
                    <div>
                      <h4 className={`text-sm font-black ${isUnlocked ? 'text-purple-950' : 'text-white/80'}`}>
                        {badge.title}
                      </h4>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-white/10 text-white/50'
                      }`}>
                        {isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
                      </span>
                    </div>
                  </div>

                  <p className={`text-xs mt-1 ${isUnlocked ? 'text-gray-600 font-medium' : 'text-white/50'}`}>
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LQChampHubPage;
