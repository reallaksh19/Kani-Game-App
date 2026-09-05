import { StarIcon } from '../shared/StarIcon';
import { QAStats, MostPlayedGame, TopPerformer, LeaderboardEntry } from '../../types';

interface QAInterfaceProps {
  stats: QAStats;
  mostPlayedGame: MostPlayedGame | null;
  topPerformers: TopPerformer[];
  recentGames: LeaderboardEntry[];
}

// Math-themed QA Interface with unique styling
export const MathQAInterface: React.FC<QAInterfaceProps> = ({ stats, mostPlayedGame, topPerformers }) => {
  return (
    <div className="w-full max-w-4xl space-y-6 relative z-20">
      {/* Math-specific header with equations animation */}
      <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-2 border-orange-500/50 rounded-2xl p-6 backdrop-blur">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">🔢</div>
          <div>
            <h2 className="text-3xl font-bold text-white">Math Analytics</h2>
            <p className="text-orange-300">Crunch the numbers!</p>
          </div>
        </div>
      </div>

      {/* Summary Stats - Math themed with equations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-4 text-center border-4 border-purple-400/30 shadow-lg shadow-purple-500/50">
          <div className="text-4xl mb-2">🎮</div>
          <div className="text-3xl font-bold text-white">{stats.totalGames}</div>
          <div className="text-purple-200 text-sm font-medium">Total Games</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-4 text-center border-4 border-yellow-400/30 shadow-lg shadow-yellow-500/50">
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-3xl font-bold text-white">{stats.totalStars}</div>
          <div className="text-yellow-100 text-sm font-medium">Total Stars</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-center border-4 border-green-400/30 shadow-lg shadow-green-500/50">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-3xl font-bold text-white">{stats.avgStars}</div>
          <div className="text-green-100 text-sm font-medium">Avg Stars</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl p-4 text-center border-4 border-red-400/30 shadow-lg shadow-red-500/50">
          <div className="text-4xl mb-2">🔥</div>
          <div className="text-3xl font-bold text-white">{stats.bestStreak}</div>
          <div className="text-red-100 text-sm font-medium">Best Streak</div>
        </div>
      </div>

      {/* Most Played Game - Math specific styling */}
      {mostPlayedGame && (
        <div className="bg-gray-900/90 rounded-2xl p-6 backdrop-blur border-2 border-orange-500/50">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🏆</span> Most Played Math Game
          </h2>
          <div className={`bg-gradient-to-br ${mostPlayedGame.color} rounded-xl p-6 shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="text-6xl">{mostPlayedGame.icon}</div>
              <div>
                <div className="text-3xl font-bold text-white">{mostPlayedGame.title}</div>
                <div className="text-white/90 text-lg">Played {mostPlayedGame.playCount} times</div>
                <div className="text-white/70 text-sm mt-1">{mostPlayedGame.description}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers - Calculator themed */}
      {topPerformers.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl p-6 backdrop-blur border-2 border-purple-500/50">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🌟</span> Top Math Champions
          </h2>
          <div className="space-y-2">
            {topPerformers.map((player, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-102 ${i === 0 ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/50 shadow-lg' :
                  i === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50' :
                    i === 2 ? 'bg-gradient-to-r from-orange-700/20 to-orange-800/20 border-2 border-orange-700/50' :
                      'bg-gray-800/50 border-2 border-gray-700/50'
                }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${i === 0 ? 'bg-yellow-500 text-black' :
                    i === 1 ? 'bg-gray-400 text-black' :
                      i === 2 ? 'bg-orange-700 text-white' :
                        'bg-gray-700 text-white'
                  }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">{player.name}</div>
                  <div className="text-gray-300 text-sm">{player.gameTitle}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                    <StarIcon className="w-5 h-5" />{player.stars}
                  </div>
                  <div className="text-orange-400 text-sm font-medium">🔥 {player.streak} streak</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MathQAInterface;
