import React, { useMemo } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { LeaderboardEntry } from '../../types';
import { ALL_GAMES, MATH_GAMES, COMPREHENSION_GAMES } from '../../data/gameDefinitions';

interface AnalyticsPageProps {
    onBack: () => void;
    leaderboard: LeaderboardEntry[];
}

const BADGES = [
    { id: 'rookie', title: 'Rookie Pilot', icon: '🧑‍🚀', desc: 'Play your first game', condition: (stats: any) => stats.totalGames >= 1 },
    { id: 'explorer', title: 'Space Explorer', icon: '🚀', desc: 'Play 10 games', condition: (stats: any) => stats.totalGames >= 10 },
    { id: 'veteran', title: 'Galaxy Guardian', icon: '🛡️', desc: 'Play 50 games', condition: (stats: any) => stats.totalGames >= 50 },
    { id: 'star_catcher', title: 'Star Catcher', icon: '⭐', desc: 'Earn 100 stars', condition: (stats: any) => stats.totalStars >= 100 },
    { id: 'supernova', title: 'Supernova', icon: '✨', desc: 'Earn 1000 stars', condition: (stats: any) => stats.totalStars >= 1000 },
    { id: 'bookworm', title: 'Bookworm', icon: '📚', desc: 'Read 5 stories', condition: (stats: any) => stats.storyGames >= 5 },
    { id: 'math_whiz', title: 'Math Whiz', icon: '🧮', desc: 'Play 10 math games', condition: (stats: any) => stats.mathGames >= 10 },
    { id: 'perfect_streak', title: 'Streak Master', icon: '🔥', desc: 'Get a streak of 10', condition: (stats: any) => stats.maxStreak >= 10 },
];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onBack, leaderboard }) => {

    const stats = useMemo(() => {
        const totalGames = leaderboard.length;
        const totalStars = leaderboard.reduce((sum, e) => sum + e.stars, 0);
        const totalHints = leaderboard.reduce((sum, e) => sum + (e.hintsUsed || 0), 0);
        const maxStreak = Math.max(...leaderboard.map(e => e.streak), 0);
        const lastEntry = leaderboard[leaderboard.length - 1];
        const playerName = lastEntry ? lastEntry.name : 'Cadet';

        // Category counts
        const storyGames = leaderboard.filter(e => COMPREHENSION_GAMES.some(g => g.id === e.game)).length;
        const mathGames = leaderboard.filter(e => MATH_GAMES.some(g => g.id === e.game)).length;

        // Daily stars (last 7 days)
        const today = new Date();
        const dailyStars = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const stars = leaderboard
                .filter(e => e.date.startsWith(dateStr))
                .reduce((sum, e) => sum + e.stars, 0);
            return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), stars };
        });

        // Game performance
        const gameStats: Record<string, { count: number, stars: number }> = {};
        leaderboard.forEach(e => {
            if (!gameStats[e.game]) gameStats[e.game] = { count: 0, stars: 0 };
            gameStats[e.game].count++;
            gameStats[e.game].stars += e.stars;
        });

        const topGames = Object.entries(gameStats)
            .map(([id, s]) => ({ id, ...s, avg: Math.round(s.stars / s.count) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalGames, totalStars, totalHints, maxStreak, playerName,
            storyGames, mathGames, dailyStars, topGames
        };
    }, [leaderboard]);

    return (
        <SpaceBackground>
            <div className="flex flex-col h-full pt-6 px-4 pb-8 overflow-y-auto w-full max-w-6xl mx-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onBack} className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 text-2xl transition-colors">←</button>
                    <div>
                        <h1 className="text-4xl font-bold text-white">My Mission Control</h1>
                        <p className="text-gray-400">Welcome back, <span className="text-yellow-400 font-bold">{stats.playerName}</span>!</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-blue-500/30 backdrop-blur">
                        <div className="text-3xl mb-2">⭐</div>
                        <div className="text-white text-3xl font-bold">{stats.totalStars}</div>
                        <div className="text-blue-300 text-sm font-bold uppercase">Total Stars</div>
                    </div>
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-green-500/30 backdrop-blur">
                        <div className="text-3xl mb-2">🎮</div>
                        <div className="text-white text-3xl font-bold">{stats.totalGames}</div>
                        <div className="text-green-300 text-sm font-bold uppercase">Games Played</div>
                    </div>
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-orange-500/30 backdrop-blur">
                        <div className="text-3xl mb-2">🔥</div>
                        <div className="text-white text-3xl font-bold">{stats.maxStreak}</div>
                        <div className="text-orange-300 text-sm font-bold uppercase">Best Streak</div>
                    </div>
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-purple-500/30 backdrop-blur">
                        <div className="text-3xl mb-2">💡</div>
                        <div className="text-white text-3xl font-bold">{stats.totalHints}</div>
                        <div className="text-purple-300 text-sm font-bold uppercase">Hints Used</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Activity Chart */}
                    <div className="bg-gray-900/60 p-6 rounded-3xl border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-6">Weekly Stars</h2>
                        <div className="flex items-end justify-between h-48 gap-2">
                            {stats.dailyStars.map((d, i) => {
                                const max = Math.max(...stats.dailyStars.map(s => s.stars), 10); // Scale max
                                const height = Math.max((d.stars / max) * 100, 5); // Min 5% height
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group">
                                        <div className="text-white text-xs mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{d.stars}</div>
                                        <div
                                            className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg transition-all hover:brightness-110"
                                            style={{ height: `${height}%` }}
                                        />
                                        <div className="text-gray-400 text-xs mt-2 font-bold">{d.day}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="bg-gray-900/60 p-6 rounded-3xl border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-6">Mission Badges</h2>
                        <div className="grid grid-cols-4 gap-4">
                            {BADGES.map(badge => {
                                const isUnlocked = badge.condition(stats);
                                return (
                                    <div key={badge.id} className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center border-2 transition-all ${isUnlocked ? 'bg-indigo-900/50 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800/30 border-gray-700 text-gray-600 grayscale'}`}>
                                        <div className="text-3xl mb-1">{badge.icon}</div>
                                        <div className="text-[10px] font-bold leading-tight">{badge.title}</div>
                                        {!isUnlocked && <div className="text-[8px] mt-1">Locked</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Top Games List */}
                <div className="bg-gray-900/60 p-6 rounded-3xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-6">Favorite Missions</h2>
                    <div className="space-y-3">
                        {stats.topGames.map((g, i) => {
                            const info = ALL_GAMES.find(def => def.id === g.id);
                            return (
                                <div key={i} className="flex items-center gap-4 bg-gray-800/40 p-4 rounded-xl hover:bg-gray-800/60 transition-colors">
                                    <div className="text-2xl">{info?.icon || '🎮'}</div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold">{info?.title || g.id}</div>
                                        <div className="text-gray-400 text-xs">{g.count} plays</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-yellow-400 font-bold">{g.avg} avg stars</div>
                                    </div>
                                </div>
                            );
                        })}
                        {stats.topGames.length === 0 && <p className="text-gray-500 text-center">No games played yet!</p>}
                    </div>
                </div>

            </div>
        </SpaceBackground>
    );
};
