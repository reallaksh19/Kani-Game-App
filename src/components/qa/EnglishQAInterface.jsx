import React from 'react';
import { StarIcon } from '../shared/StarIcon';

// English-themed QA Interface with book/library aesthetic
export const EnglishQAInterface = ({ stats, mostPlayedGame, topPerformers, recentGames }) => {
  return (
    <div className="w-full max-w-4xl space-y-6 relative z-20">
      {/* English-specific header with book aesthetic */}
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-2xl p-6 backdrop-blur">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">📚</div>
          <div>
            <h2 className="text-3xl font-bold text-white">English Analytics</h2>
            <p className="text-blue-300">Master the language!</p>
          </div>
        </div>
      </div>

      {/* Summary Stats - Book themed */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-4 text-center border-4 border-indigo-400/30 shadow-lg shadow-indigo-500/50 transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-2">📖</div>
          <div className="text-3xl font-bold text-white">{stats.totalGames}</div>
          <div className="text-indigo-200 text-sm font-medium">Lessons</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl p-4 text-center border-4 border-cyan-400/30 shadow-lg shadow-cyan-500/50 transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-2">✨</div>
          <div className="text-3xl font-bold text-white">{stats.totalStars}</div>
          <div className="text-cyan-100 text-sm font-medium">Total Stars</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-center border-4 border-emerald-400/30 shadow-lg shadow-emerald-500/50 transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-3xl font-bold text-white">{stats.avgStars}</div>
          <div className="text-emerald-100 text-sm font-medium">Average</div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-center border-4 border-violet-400/30 shadow-lg shadow-violet-500/50 transform hover:scale-105 transition-transform">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-3xl font-bold text-white">{stats.bestStreak}</div>
          <div className="text-violet-100 text-sm font-medium">Best Streak</div>
        </div>
      </div>

      {/* Most Played Game - Library card style */}
      {mostPlayedGame && (
        <div className="bg-gradient-to-br from-gray-900/90 to-blue-900/80 rounded-2xl p-6 backdrop-blur border-2 border-blue-500/50 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📚</span> Favorite English Game
          </h2>
          <div className={`bg-gradient-to-br ${mostPlayedGame.color} rounded-xl p-6 shadow-2xl border-4 border-white/20`}>
            <div className="flex items-center gap-4">
              <div className="text-6xl bg-white/10 p-4 rounded-xl">{mostPlayedGame.icon}</div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">{mostPlayedGame.title}</div>
                <div className="text-white/90 text-lg font-medium">📊 {mostPlayedGame.playCount} sessions completed</div>
                <div className="text-white/70 text-sm mt-2 bg-white/10 px-3 py-1 rounded-full inline-block">
                  {mostPlayedGame.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers - Honor roll style */}
      {topPerformers.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900/90 to-indigo-900/80 rounded-2xl p-6 backdrop-blur border-2 border-indigo-500/50">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🏆</span> Honor Roll - Top Readers
          </h2>
          <div className="space-y-3">
            {topPerformers.map((player, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-102 ${
                i === 0 ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/30' :
                i === 1 ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/50' :
                i === 2 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50' :
                'bg-gray-800/60 border-2 border-gray-700/50'
              }`}>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' :
                  i === 1 ? 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white' :
                  i === 2 ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' :
                  'bg-gradient-to-br from-gray-600 to-gray-700 text-white'
                }`}>
                  {i === 0 ? '👑' : i === 1 ? '📘' : i === 2 ? '📗' : `${i + 1}`}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg flex items-center gap-2">
                    {player.name}
                    {i === 0 && <span className="text-yellow-400 text-sm">★ Star Reader</span>}
                  </div>
                  <div className="text-gray-300 text-sm flex items-center gap-2">
                    <span>📖</span> {player.gameTitle}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-cyan-400 font-bold text-lg">
                    <StarIcon className="w-5 h-5" />{player.stars}
                  </div>
                  <div className="text-indigo-300 text-sm font-medium">📚 {player.streak} in a row</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnglishQAInterface;
