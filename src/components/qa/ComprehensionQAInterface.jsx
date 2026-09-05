import React from 'react';
import { StarIcon } from '../shared/StarIcon';

// Comprehension-themed QA Interface with detective/mystery aesthetic
export const ComprehensionQAInterface = ({ stats, mostPlayedGame, topPerformers, recentGames }) => {
  return (
    <div className="w-full max-w-4xl space-y-6 relative z-20">
      {/* Comprehension-specific header with detective theme */}
      <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-2 border-teal-500/50 rounded-2xl p-6 backdrop-blur shadow-xl shadow-teal-500/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">🔍</div>
          <div>
            <h2 className="text-3xl font-bold text-white">Comprehension Analytics</h2>
            <p className="text-teal-300">Uncover the story clues!</p>
          </div>
        </div>
      </div>

      {/* Summary Stats - Detective themed with magnifying glass */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-2xl p-4 text-center border-4 border-teal-400/40 shadow-lg shadow-teal-500/50">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-3xl font-bold text-white">{stats.totalGames}</div>
          <div className="text-teal-100 text-sm font-medium">Stories Read</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-center border-4 border-indigo-400/40 shadow-lg shadow-indigo-500/50">
          <div className="text-4xl mb-2">💡</div>
          <div className="text-3xl font-bold text-white">{stats.totalStars}</div>
          <div className="text-indigo-100 text-sm font-medium">Clues Found</div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl p-4 text-center border-4 border-violet-400/40 shadow-lg shadow-violet-500/50">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-3xl font-bold text-white">{stats.avgStars}</div>
          <div className="text-violet-100 text-sm font-medium">Avg Score</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-4 text-center border-4 border-cyan-400/40 shadow-lg shadow-cyan-500/50">
          <div className="text-4xl mb-2">🔎</div>
          <div className="text-3xl font-bold text-white">{stats.bestStreak}</div>
          <div className="text-cyan-100 text-sm font-medium">Best Streak</div>
        </div>
      </div>

      {/* Most Played Game - Case file style */}
      {mostPlayedGame && (
        <div className="bg-gradient-to-br from-gray-900/90 to-teal-900/80 rounded-2xl p-6 backdrop-blur border-2 border-teal-500/50 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🗂️</span> Most Investigated Case
          </h2>
          <div className={`bg-gradient-to-br ${mostPlayedGame.color} rounded-xl p-6 shadow-2xl border-4 border-teal-400/30 relative overflow-hidden`}>
            {/* Detective badge decoration */}
            <div className="absolute top-2 right-2 bg-yellow-400 text-black rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl shadow-lg">
              🔍
            </div>
            <div className="flex items-center gap-4">
              <div className="text-6xl bg-teal-900/50 p-4 rounded-xl border-2 border-teal-400/30">{mostPlayedGame.icon}</div>
              <div className="flex-1">
                <div className="text-3xl font-bold text-white mb-1">{mostPlayedGame.title}</div>
                <div className="text-teal-100 text-lg font-medium">🔎 Investigated {mostPlayedGame.playCount} times</div>
                <div className="text-teal-200/80 text-sm mt-2 bg-teal-900/30 px-4 py-2 rounded-lg inline-block border border-teal-400/20">
                  {mostPlayedGame.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers - Detective ranking */}
      {topPerformers.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900/90 to-cyan-900/80 rounded-2xl p-6 backdrop-blur border-2 border-cyan-500/50 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🕵️</span> Master Detectives
          </h2>
          <div className="space-y-3">
            {topPerformers.map((player, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-102 ${
                i === 0 ? 'bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border-2 border-teal-400/60 shadow-lg shadow-teal-500/30' :
                i === 1 ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border-2 border-indigo-400/50' :
                i === 2 ? 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border-2 border-purple-400/50' :
                'bg-gray-800/60 border-2 border-gray-700/50'
              }`}>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg relative ${
                  i === 0 ? 'bg-gradient-to-br from-teal-400 to-cyan-500 text-black' :
                  i === 1 ? 'bg-gradient-to-br from-indigo-400 to-violet-500 text-white' :
                  i === 2 ? 'bg-gradient-to-br from-purple-400 to-fuchsia-500 text-white' :
                  'bg-gradient-to-br from-gray-600 to-gray-700 text-white'
                }`}>
                  {i === 0 ? '🕵️' : i === 1 ? '🔍' : i === 2 ? '📖' : `${i + 1}`}
                  {i === 0 && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      ⭐
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg flex items-center gap-2">
                    {player.name}
                    {i === 0 && <span className="text-teal-300 text-xs bg-teal-900/50 px-2 py-1 rounded-full border border-teal-400/30">★ Chief Detective</span>}
                  </div>
                  <div className="text-gray-300 text-sm flex items-center gap-2">
                    <span>📚</span> {player.gameTitle}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-teal-300 font-bold text-lg">
                    <StarIcon className="w-5 h-5" />{player.stars}
                  </div>
                  <div className="text-cyan-300 text-sm font-medium bg-cyan-900/30 px-2 py-1 rounded-full">
                    🔎 {player.streak} cases
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprehensionQAInterface;
