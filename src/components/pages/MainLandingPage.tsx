import React from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { LeaderboardEntry, Settings } from '../../types';
import { MASTER_TILES, DEFAULT_MASTER_TILES } from '../../utils/masterTiles';

interface MainLandingPageProps {
    onSelectSubject: (subject: string) => void;
    totalStars: number;
    onOpenLeaderboard: () => void;
    onOpenQA: () => void;
    onOpenSettings: () => void;
    leaderboard?: LeaderboardEntry[];
    settings?: Settings;
}

export const MainLandingPage: React.FC<MainLandingPageProps> = ({ onSelectSubject, totalStars, onOpenLeaderboard, onOpenQA, onOpenSettings, leaderboard = [], settings }) => {
    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
        if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
        return { text: 'Good Evening', emoji: '🌙' };
    };
    const greeting = getGreeting();

    // Calculate achievements
    const totalGames = leaderboard.length;
    const bestStreak = leaderboard.reduce((max, g) => Math.max(max, g.streak || 0), 0);

    // Floating elements for fun animation
    const floatingItems = ['🚀', '⭐', '🌍', '🛸', '💫', '🌟'];

    return (
        <SpaceBackground>
            {/* Settings button - top right */}
            <button onClick={onOpenSettings} aria-label="Settings" className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gray-900/80 flex items-center justify-center text-2xl hover:bg-gray-700 z-30 cursor-pointer transition-all hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400">
                ⚙️
            </button>

            {/* Floating decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {floatingItems.map((item, i) => (
                    <div key={i} className="absolute text-4xl opacity-40"
                        style={{
                            left: `${10 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                            animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                            animationDelay: `${i * 0.3}s`
                        }}>
                        {item}
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center justify-center min-h-full px-4 py-6 relative z-10">
                {/* Mascot and Greeting */}
                <div className="text-center mb-4">
                    <div className="text-7xl mb-2" style={{ animation: 'float 2s ease-in-out infinite' }}>🤖</div>
                    <p className="text-lg text-purple-200">{greeting.emoji} {greeting.text}, Explorer!</p>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 text-center">
                    <span className="bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">
                        Learning Galaxy
                    </span>
                </h1>
                <p className="text-sm sm:text-base text-purple-300 mb-4">Fun learning for Grade 3-4! 🎮</p>

                {/* Stats Cards - Mobile friendly row */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 relative z-20">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 px-3 py-2 rounded-full">
                        <span className="text-xl">⭐</span>
                        <span className="text-yellow-300 font-bold text-sm sm:text-base">{totalStars}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 px-3 py-2 rounded-full">
                        <span className="text-xl">🎮</span>
                        <span className="text-green-300 font-bold text-sm sm:text-base">{totalGames} played</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 px-3 py-2 rounded-full">
                        <span className="text-xl">🔥</span>
                        <span className="text-orange-300 font-bold text-sm sm:text-base">{bestStreak} streak</span>
                    </div>
                </div>

                {/* Subject Cards - Dynamic responsive grid according to master tile settings */}
                {(() => {
                    const enabledTilesMap = settings?.enabledMasterTiles || DEFAULT_MASTER_TILES;
                    const activeTiles = MASTER_TILES.filter(tile => enabledTilesMap[tile.id] !== false);

                    if (activeTiles.length === 0) {
                        return (
                            <div className="bg-gray-900/80 p-8 rounded-3xl border border-yellow-500/30 text-center max-w-md relative z-20 mb-6 shadow-2xl backdrop-blur">
                                <span className="text-5xl mb-2 block animate-bounce">🔒</span>
                                <h3 className="text-xl font-bold text-white mb-2">All Subject Tiles Are Hidden</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    You have turned off all master tiles in Settings. Enable at least one subject tile to start playing!
                                </p>
                                <button
                                    onClick={onOpenSettings}
                                    className="bg-yellow-500 text-gray-900 px-6 py-2.5 rounded-full font-bold hover:bg-yellow-400 transition cursor-pointer"
                                >
                                    Open Settings ⚙️
                                </button>
                            </div>
                        );
                    }

                    const gridColsClass =
                        activeTiles.length >= 5 ? 'sm:max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
                        activeTiles.length === 4 ? 'sm:max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                        activeTiles.length === 3 ? 'sm:max-w-4xl grid-cols-1 sm:grid-cols-3' :
                        activeTiles.length === 2 ? 'sm:max-w-2xl grid-cols-1 sm:grid-cols-2' :
                        'max-w-sm grid-cols-1';

                    return (
                        <div className={`grid ${gridColsClass} gap-4 w-full max-w-md relative z-20 mb-6`}>
                            {activeTiles.map(tile => (
                                <button
                                    key={tile.id}
                                    onClick={() => onSelectSubject(tile.id)}
                                    className={`bg-gradient-to-br ${tile.gradient} p-6 sm:p-8 rounded-3xl shadow-2xl hover:scale-105 transition-all text-left cursor-pointer border-2 ${tile.border} group focus:outline-none focus-visible:ring-4 ${tile.ringColor}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform">
                                                {tile.icon}
                                            </div>
                                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                                {tile.title}
                                            </h2>
                                            <p className="text-white/80 text-sm font-medium">
                                                {tile.badgeLabel}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    );
                })()}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 relative z-20">
                    <button onClick={onOpenLeaderboard}
                        className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 rounded-full font-bold text-white hover:scale-105 transition-all shadow-lg cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400">
                        <span className="text-2xl">🏆</span>
                        <span>My Mission Control</span>
                    </button>
                    <button onClick={onOpenQA}
                        className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 rounded-full font-bold text-white hover:scale-105 transition-all shadow-lg cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400">
                        <span className="text-2xl">📊</span>
                        <span>QA Analytics</span>
                    </button>
                </div>
            </div>
        </SpaceBackground>
    );
};
