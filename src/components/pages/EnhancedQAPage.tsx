import React from 'react';
import { MATH_GAMES, ALL_GAMES } from '../../data/gameDefinitions';
import { MathQAInterface } from '../qa/MathQAInterface';
import { EnglishQAInterface } from '../qa/EnglishQAInterface';
import { ComprehensionQAInterface } from '../qa/ComprehensionQAInterface';
import { THEME_COLORS } from '../../themes/themeConfig';

import { LeaderboardEntry, TopPerformer } from '../../types';

// Shared SpaceBackground component
interface SpaceBackgroundProps {
  children: React.ReactNode;
  variant?: string;
}

const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ children, variant = 'default' }) => {
  const [bubbles] = React.useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
    }))
  );

  const themeConfig = (THEME_COLORS as any)[variant] || THEME_COLORS.default;

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: themeConfig.background }}
    >
      <div className="pointer-events-none absolute inset-0">
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="absolute rounded-full bg-white opacity-60"
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: bubble.size,
              height: bubble.size,
              animation: `twinkle ${bubble.duration}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 h-full">{children}</div>
      <style>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

interface EnhancedQAPageProps {
  onBack: () => void;
  leaderboard: LeaderboardEntry[];
}

// Enhanced QA Page with theme-specific interfaces
export const EnhancedQAPage: React.FC<EnhancedQAPageProps> = ({ onBack, leaderboard }) => {
  const [selectedTheme, setSelectedTheme] = React.useState('all');

  // Filter by theme
  const filterByTheme = (theme: string): LeaderboardEntry[] => {
    if (theme === 'all') return leaderboard;
    if (theme === 'math') {
      return leaderboard.filter((s) => MATH_GAMES.find((g) => g.id === s.game));
    }
    if (theme === 'comprehension') {
      return leaderboard.filter((s) =>
        ['story-nebula', 'inference-investigator'].includes(s.game)
      );
    }
    // English (non-math, non-comprehension)
    return leaderboard.filter(
      (s) =>
        !MATH_GAMES.find((g) => g.id === s.game) &&
        !['story-nebula', 'inference-investigator'].includes(s.game)
    );
  };

  const filteredLeaderboard = filterByTheme(selectedTheme);

  // Most played game in filtered data
  const gameCount: Record<string, number> = {};
  filteredLeaderboard.forEach((s) => {
    gameCount[s.game] = (gameCount[s.game] || 0) + 1;
  });
  const mostPlayedGameId =
    Object.keys(gameCount).length > 0
      ? Object.keys(gameCount).reduce((a, b) => (gameCount[a] > gameCount[b] ? a : b))
      : null;
  const mostPlayedGameInfo = mostPlayedGameId
    ? ALL_GAMES.find((g) => g.id === mostPlayedGameId)
    : null;
  const mostPlayedGame = mostPlayedGameInfo && mostPlayedGameId
    ? {
      ...mostPlayedGameInfo,
      playCount: gameCount[mostPlayedGameId],
    }
    : null;

  // Top performers
  const topPerformers = [...filteredLeaderboard]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5)
    .reduce<TopPerformer[]>((acc, curr) => {
      if (!acc.find((p) => p.name === curr.name)) {
        const gameInfo = ALL_GAMES.find((g) => g.id === curr.game);
        acc.push({
          ...curr,
          gameTitle: gameInfo?.title || curr.game,
        });
      }
      return acc;
    }, []);

  // Recent activity
  const recentGames = [...filteredLeaderboard]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const stats = {
    totalGames: filteredLeaderboard.length,
    totalStars: filteredLeaderboard.reduce((sum, s) => sum + s.stars, 0),
    avgStars:
      filteredLeaderboard.length > 0
        ? Math.round(
          filteredLeaderboard.reduce((sum, s) => sum + s.stars, 0) /
          filteredLeaderboard.length
        )
        : 0,
    bestStreak: filteredLeaderboard.reduce((max, s) => Math.max(max, s.streak || 0), 0),
  };

  // Determine background variant
  const getVariant = () => {
    if (selectedTheme === 'math') return 'math';
    if (selectedTheme === 'english') return 'english';
    if (selectedTheme === 'comprehension') return 'comprehension';
    return 'default';
  };

  return (
    <SpaceBackground variant={getVariant()}>
      <div className="flex flex-col items-center h-full pt-8 px-4 overflow-y-auto pb-8">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gray-900/80 flex items-center justify-center text-white hover:bg-gray-700 z-20 cursor-pointer transition-all hover:scale-110"
        >
          ←
        </button>

        <h1 className="text-4xl font-bold text-white mb-2">📊 Analytics Dashboard</h1>
        <p className="text-purple-300 mb-6 text-center">
          Choose a theme to see detailed analytics
        </p>

        {/* Theme Selector */}
        <div className="flex flex-wrap gap-3 mb-8 relative z-20">
          {[
            { id: 'all', label: 'All Games', icon: '🎮', color: 'from-purple-500 to-indigo-500' },
            { id: 'math', label: 'Math', icon: '🔢', color: 'from-orange-500 to-yellow-500' },
            { id: 'english', label: 'English', icon: '📚', color: 'from-blue-500 to-cyan-500' },
            {
              id: 'comprehension',
              label: 'Reading',
              icon: '🔍',
              color: 'from-teal-500 to-cyan-500',
            },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all transform hover:scale-105 cursor-pointer ${selectedTheme === theme.id
                ? `bg-gradient-to-r ${theme.color} text-white shadow-lg`
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              <span className="text-xl">{theme.icon}</span>
              <span>{theme.label}</span>
            </button>
          ))}
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-gray-900/80 rounded-2xl p-8 backdrop-blur text-center max-w-md">
            <div className="text-6xl mb-4">📈</div>
            <p className="text-gray-400 text-lg">
              No data yet! Play some games to see analytics.
            </p>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="bg-gray-900/80 rounded-2xl p-8 backdrop-blur text-center max-w-md">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-gray-400 text-lg">
              No {selectedTheme} games played yet!
            </p>
          </div>
        ) : (
          <>
            {/* Render theme-specific interface */}
            {selectedTheme === 'math' && (
              <MathQAInterface
                stats={stats}
                mostPlayedGame={mostPlayedGame}
                topPerformers={topPerformers}
                recentGames={recentGames}
              />
            )}
            {selectedTheme === 'english' && (
              <EnglishQAInterface
                stats={stats}
                mostPlayedGame={mostPlayedGame}
                topPerformers={topPerformers}
                recentGames={recentGames}
              />
            )}
            {selectedTheme === 'comprehension' && (
              <ComprehensionQAInterface
                stats={stats}
                mostPlayedGame={mostPlayedGame}
                topPerformers={topPerformers}
                recentGames={recentGames}
              />
            )}
            {selectedTheme === 'all' && (
              <MathQAInterface
                stats={stats}
                mostPlayedGame={mostPlayedGame}
                topPerformers={topPerformers}
                recentGames={recentGames}
              />
            )}
          </>
        )}
      </div>
    </SpaceBackground>
  );
};

export default EnhancedQAPage;
