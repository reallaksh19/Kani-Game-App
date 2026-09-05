import React, { useState } from 'react';
import { LeaderboardEntry, Settings } from '../../types';

interface LQChampHubPageProps {
  onBack: () => void;
  onSelectGame: (gameId: string) => void;
  leaderboard?: LeaderboardEntry[];
  totalStars: number;
  settings: Settings;
}

interface SkillItem {
  id: string;
  title: string;
  icon: string;
  category: string;
  solvedCount: number;
  openCount: number;
  level: number;
  levelTitle: string;
  progressPercent: number;
  description: string;
  bgColor: string;
}

export const LQChampHubPage: React.FC<LQChampHubPageProps> = ({
  onBack,
  onSelectGame,
  leaderboard = [],
  totalStars
}) => {
  // Calculate dynamic proficiency based on leaderboard or default to motivating baseline
  const lqGamesPlayed = leaderboard.filter(e => e.game.startsWith('lq-')).length;
  const lqStars = leaderboard.filter(e => e.game.startsWith('lq-')).reduce((sum, e) => sum + e.stars, 0);
  const proficiency = lqGamesPlayed > 0 ? Math.min(100, Math.round(30 + (lqStars / 50) * 70)) : 30;

  const [activeTab, setActiveTab] = useState<'skills' | 'lots'>('skills');

  // 5 LogIQids Skills from the official breakdown
  const skills: SkillItem[] = [
    {
      id: 'lq-lot-1',
      title: 'Numerical Ability',
      icon: '👁️',
      category: 'Numerical',
      solvedCount: lqGamesPlayed > 0 ? 3 : 0,
      openCount: 1,
      level: 1,
      levelTitle: 'Beginner',
      progressPercent: 28,
      description: 'Calendar math, place value riddles, shape sum logic',
      bgColor: 'bg-cyan-50 text-cyan-600'
    },
    {
      id: 'lq-lot-1',
      title: 'Verbal',
      icon: '📋',
      category: 'Verbal',
      solvedCount: lqGamesPlayed > 0 ? 11 : 0,
      openCount: 0,
      level: 2,
      levelTitle: 'Learner',
      progressPercent: 52,
      description: 'Preposition clash, homophones, vowel counts',
      bgColor: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 'lq-lot-1',
      title: 'Memory and Concentration',
      icon: '🔤',
      category: 'Spatial',
      solvedCount: lqGamesPlayed > 0 ? 1 : 0,
      openCount: 1,
      level: 1,
      levelTitle: 'Beginner',
      progressPercent: 20,
      description: 'Compass turns, beach facing rotations, spatial sense',
      bgColor: 'bg-amber-50 text-amber-600'
    },
    {
      id: 'lq-lot-1',
      title: 'Analytical Thinking',
      icon: '🧩',
      category: 'Analytical',
      solvedCount: lqGamesPlayed > 0 ? 4 : 0,
      openCount: 1,
      level: 1,
      levelTitle: 'Beginner',
      progressPercent: 35,
      description: 'Secret ciphers, blood relations, odd one out, series',
      bgColor: 'bg-purple-50 text-purple-600'
    },
    {
      id: 'lq-lot-1',
      title: 'Visual Reasoning',
      icon: '📐',
      category: 'Visual',
      solvedCount: lqGamesPlayed > 0 ? 2 : 0,
      openCount: 1,
      level: 1,
      levelTitle: 'Beginner',
      progressPercent: 25,
      description: 'Embedded hidden figures without rotation, pattern matrices',
      bgColor: 'bg-rose-50 text-rose-600'
    }
  ];

  // 5 Lots (Thinksheets)
  const lots = [
    {
      id: 'lq-lot-1',
      title: 'Thinksheet Lot 1',
      subtitle: '20 Questions (15 Medium, 5 Hard)',
      icon: '🏆',
      status: 'Open',
      badge: 'Active Now',
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'lq-lot-2',
      title: 'Thinksheet Lot 2',
      subtitle: '20 Questions (15 Medium, 5 Hard)',
      icon: '⚡',
      status: 'Coming Soon',
      badge: 'Unlocked at LV2',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'lq-lot-3',
      title: 'Thinksheet Lot 3',
      subtitle: '20 Questions (15 Medium, 5 Hard)',
      icon: '🧠',
      status: 'Coming Soon',
      badge: 'Unlocked at LV3',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'lq-lot-4',
      title: 'Thinksheet Lot 4',
      subtitle: '20 Questions (15 Medium, 5 Hard)',
      icon: '🎯',
      status: 'Coming Soon',
      badge: 'Unlocked at LV4',
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 'lq-lot-5',
      title: 'Thinksheet Lot 5',
      subtitle: '20 Questions (15 Medium, 5 Hard)',
      icon: '🌟',
      status: 'Coming Soon',
      badge: 'Championship Final',
      color: 'from-blue-600 to-violet-700'
    }
  ];

  return (
    <div className="min-h-screen bg-[#5c4fd6] text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/10 bg-[#4e41c4]/60 backdrop-blur sticky top-0 z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold transition-all cursor-pointer"
        >
          <span>←</span>
          <span>Home</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="bg-white/15 px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold text-yellow-300">
            <span>⭐</span>
            <span>{totalStars} Stars</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* LogIQids Top Proficiency & Thinksheet Status Banner */}
        <div className="bg-white/10 border border-white/20 rounded-3xl p-6 mb-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Overall Proficiency Gauge */}
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 flex items-center justify-center bg-white/10 rounded-full border-4 border-amber-400/80 shadow-inner">
                <span className="text-3xl">🎯</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-4xl md:text-5xl font-black text-white">{proficiency}%</span>
                  <span className="text-xs bg-white/20 text-white/90 px-2 py-0.5 rounded-full font-bold cursor-help" title="Calculated based on question accuracy across all 5 skills">
                    ⓘ
                  </span>
                </div>
                <div className="text-sm uppercase tracking-wider font-extrabold text-purple-200">
                  Overall Proficiency
                </div>
              </div>
            </div>

            {/* Right: Thinksheets Remaining & Expiry */}
            <div className="flex items-center gap-4 bg-black/20 px-6 py-4 rounded-2xl border border-white/10">
              <span className="text-4xl">📁</span>
              <div>
                <div className="text-2xl font-black text-white">
                  1 <span className="text-sm font-normal text-purple-200">Thinksheet Ready</span>
                </div>
                <div className="text-xs text-purple-300 font-medium">
                  Lot 1: 15 Medium, 5 Hard • Expiry Date: 31st Oct, 2026
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher: Skills vs Lots */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Select a skill and solve thinksheets
            </h2>
            <p className="text-purple-200 text-sm">
              Level up from Beginner to Champ across all 5 Olympiad domains!
            </p>
          </div>

          <div className="flex bg-black/30 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'skills' ? 'bg-white text-purple-900 shadow-md' : 'text-purple-200 hover:text-white'
              }`}
            >
              5 Skills
            </button>
            <button
              onClick={() => setActiveTab('lots')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'lots' ? 'bg-white text-purple-900 shadow-md' : 'text-purple-200 hover:text-white'
              }`}
            >
              5 Lots (Thinksheets)
            </button>
          </div>
        </div>

        {/* Tab 1: 5 Skills (LogIQids Layout) */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {skills.map((skill) => (
              <div
                key={skill.title}
                onClick={() => onSelectGame(skill.id)}
                className="bg-white rounded-3xl p-5 shadow-2xl border-4 border-cyan-300/30 hover:border-cyan-400 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between text-gray-800 relative group"
              >
                {/* Header: Icon, Title, Stats, Info */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl p-3 rounded-2xl ${skill.bgColor}`}>
                        {skill.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 leading-tight">
                          {skill.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-500 mt-1">
                          <span>Solved: <strong className="text-purple-600">{skill.solvedCount}</strong></span>
                          <span>Open: <strong className="text-emerald-600">{skill.openCount}</strong></span>
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-400 hover:text-purple-600 text-sm font-bold cursor-help" title={skill.description}>
                      ⓘ
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {skill.description}
                  </p>
                </div>

                {/* Level Badge & Stepped Progress Bar */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-purple-100 text-purple-800 text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Level {skill.level} • {skill.levelTitle}
                    </span>
                    <span className="text-xs font-extrabold text-amber-600">
                      {skill.progressPercent}%
                    </span>
                  </div>

                  {/* Striped Progress Bar */}
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden p-0.5 relative mb-1">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${skill.progressPercent}%`,
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.4) 8px, rgba(255,255,255,0.4) 16px)'
                      }}
                    />
                  </div>

                  {/* Milestone Markers */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 px-1">
                    {['LV1', 'LV2', 'LV3', 'LV4', 'LV5'].map((lv, i) => (
                      <div key={lv} className="flex flex-col items-center">
                        <span className={skill.level >= i + 1 ? 'text-amber-500' : 'text-gray-300'}>▲</span>
                        <span className={skill.level >= i + 1 ? 'text-gray-800 font-extrabold' : ''}>{lv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA on Hover */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-purple-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
                  <span>Start Practice →</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">20 Qs</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: 5 Lots (Thinksheets View) */}
        {activeTab === 'lots' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lots.map((lot, idx) => {
              const isOpen = lot.status === 'Open';
              return (
                <div
                  key={lot.title}
                  onClick={() => isOpen && onSelectGame(lot.id)}
                  className={`rounded-3xl p-6 shadow-2xl transition-all relative overflow-hidden text-left flex flex-col justify-between border-2 ${
                    isOpen
                      ? 'bg-gradient-to-br ' + lot.color + ' border-amber-300/40 hover:scale-105 cursor-pointer text-white'
                      : 'bg-white/10 border-white/10 opacity-60 cursor-not-allowed text-white/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-5xl">{lot.icon}</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        isOpen ? 'bg-white text-orange-600 shadow' : 'bg-black/30 text-white/60'
                      }`}>
                        {lot.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-black mb-1">{lot.title}</h3>
                    <p className="text-xs opacity-90 mb-4">{lot.subtitle}</p>
                  </div>

                  <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isOpen ? '20 Questions • Tap to Play' : '🔒 Locked'}
                    </span>
                    <span className="text-lg">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default LQChampHubPage;
