import React from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { LeaderboardEntry } from '../../types';
import { MATH_GAMES, GRAMMAR_GAMES, VOCABULARY_GAMES, COMPREHENSION_GAMES, SKILL_GAMES, EXAM_GAMES, LQ_CHAMP_GAMES } from '../../data/gameDefinitions';

interface MainLandingPageProps {
    onSelectSubject: (subject: string) => void;
    totalStars: number;
    onOpenLeaderboard: () => void;
    onOpenQA: () => void;
    onOpenSettings: () => void;
    leaderboard?: LeaderboardEntry[];
}

export const MainLandingPage: React.FC<MainLandingPageProps> = ({ onSelectSubject, totalStars, onOpenLeaderboard, onOpenQA, onOpenSettings, leaderboard = [] }) => {
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

                {/* Subject Cards - Responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full max-w-md sm:max-w-6xl relative z-20 mb-6">
                    <button onClick={() => onSelectSubject('math')}
                        className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 p-6 sm:p-8 rounded-3xl shadow-2xl hover:scale-105 transition-all text-left cursor-pointer border-2 border-purple-400/30 group focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform">🔢</div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Math</h2>
                                <p className="text-purple-200 text-sm">{MATH_GAMES.length} fun games!</p>
                            </div>
                        </div>
                    </button>
                    <button onClick={() => onSelectSubject('english')}
                        className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-700 p-6 sm:p-8 rounded-3xl shadow-2xl hover:scale-105 transition-all text-left cursor-pointer border-2 border-blue-400/30 group focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform">📚</div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">English</h2>
                                <p className="text-blue-200 text-sm">{GRAMMAR_GAMES.length + VOCABULARY_GAMES.length + COMPREHENSION_GAMES.length} fun games!</p>
                            </div>
                        </div>
                    </button>
                    <button onClick={() => onSelectSubject('braintraining')}
                        className="bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 p-6 sm:p-8 rounded-3xl shadow-2xl hover:scale-105 transition-all text-left cursor-pointer border-2 border-pink-400/30 group focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform" style={{ animation: 'float 2s ease-in-out infinite' }}>🧠</div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Brain Training</h2>
                                <p className="text-pink-200 text-sm">{SKILL_GAMES.length} skill games!</p>
                            </div>
                        </div>
                    </button>
                    <button onClick={() => onSelectSubject('exam')}
                        className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 sm:p-8 rounded-3xl shadow-2xl hover:scale-105 transition-all text-left cursor-pointer border-2 border-blue-400/30 group focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform">📝</div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Exam</h2>
                                <p className="text-blue-200 text-sm">{EXAM_GAMES.length} tests!</p>
                            </div>
                        </div>
                    </button>
                    <button onClick={() => onSelectSubject('lqchamp')}
                        className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-6 sm:p-8 rounded-3xl shadow-2xl hover:scale-105 transition-all text-left cursor-pointer border-2 border-amber-400/30 group focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform" style={{ animation: 'float 2s ease-in-out infinite' }}>🏆</div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">LQ Champ</h2>
                                <p className="text-amber-100 text-sm">{LQ_CHAMP_GAMES.length} Olympiad lots!</p>
                            </div>
                        </div>
                    </button>
                </div>

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
