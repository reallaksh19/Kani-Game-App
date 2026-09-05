import React, { useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { SKILL_GAMES } from '../../data/gameDefinitions';
import { GameDefinition, Difficulty, Settings } from '../../types';

interface BrainTrainingPageProps {
    onBack: () => void;
    onSelectGame: (game: GameDefinition) => void;
    onSelectDifficulty: (difficulty: Difficulty) => void;
    settings: Settings;
    leaderboard?: any[]; // For future use if needed
}

export const BrainTrainingPage: React.FC<BrainTrainingPageProps> = ({
    onBack,
    onSelectGame,
    onSelectDifficulty,
    settings
}) => {
    const isUnlocked = (game: GameDefinition) => {
        if (!settings.surpriseMode) return true;

        // Deterministic randomness
        const charSum = game.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (charSum % 3) !== 0;
    };
    const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null);
    const [showDifficulty, setShowDifficulty] = useState(false);

    // Fun floating brain particles
    const brainParticles = ['🧠', '💡', '⚡', '🎯', '✨', '🌟', '🔮', '💭'];

    const handleGameClick = (game: GameDefinition) => {
        if (!settings.difficultyFilterEnabled) {
            onSelectDifficulty('None');
            onSelectGame(game);
        } else {
            setSelectedGame(game);
            setShowDifficulty(true);
        }
    };

    const handleDifficultySelect = (difficulty: Difficulty) => {
        if (selectedGame) {
            onSelectDifficulty(difficulty);
            onSelectGame(selectedGame);
        }
    };

    const handleBackFromDifficulty = () => {
        setShowDifficulty(false);
        setSelectedGame(null);
    };

    // Difficulty selection modal
    if (showDifficulty && selectedGame) {
        return (
            <SpaceBackground>
                <div className="flex flex-col items-center justify-center min-h-full px-4 py-6">
                    {/* Back button */}
                    <button
                        onClick={handleBackFromDifficulty}
                        className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all z-30"
                    >
                        <span className="text-xl">←</span>
                        <span className="text-white font-medium">Back</span>
                    </button>

                    {/* Game icon with bounce animation */}
                    <div
                        className="text-8xl mb-6"
                        style={{ animation: 'bounce 1s ease-in-out infinite' }}
                    >
                        {selectedGame.icon}
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">{selectedGame.title}</h2>
                    <p className="text-purple-200 mb-8">{selectedGame.description}</p>

                    <h3 className="text-xl text-white mb-4">Choose Your Challenge! 🎮</h3>

                    {/* Difficulty buttons with kid-friendly styling */}
                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <button
                            onClick={() => handleDifficultySelect('Easy')}
                            className="group bg-gradient-to-r from-green-400 to-emerald-500 p-5 rounded-2xl shadow-xl hover:scale-105 transition-all border-2 border-green-300/50"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl group-hover:animate-bounce">🌱</span>
                                    <div className="text-left">
                                        <div className="text-xl font-bold text-white">Easy</div>
                                        <div className="text-green-100 text-sm">Perfect for beginners!</div>
                                    </div>
                                </div>
                                <span className="text-2xl">→</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleDifficultySelect('Medium')}
                            className="group bg-gradient-to-r from-yellow-400 to-orange-500 p-5 rounded-2xl shadow-xl hover:scale-105 transition-all border-2 border-yellow-300/50"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl group-hover:animate-bounce">🌟</span>
                                    <div className="text-left">
                                        <div className="text-xl font-bold text-white">Medium</div>
                                        <div className="text-yellow-100 text-sm">A fun challenge!</div>
                                    </div>
                                </div>
                                <span className="text-2xl">→</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleDifficultySelect('Hard')}
                            className="group bg-gradient-to-r from-red-400 to-pink-500 p-5 rounded-2xl shadow-xl hover:scale-105 transition-all border-2 border-red-300/50"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl group-hover:animate-bounce">🔥</span>
                                    <div className="text-left">
                                        <div className="text-xl font-bold text-white">Hard</div>
                                        <div className="text-red-100 text-sm">Brain power mode!</div>
                                    </div>
                                </div>
                                <span className="text-2xl">→</span>
                            </div>
                        </button>
                    </div>
                </div>
            </SpaceBackground>
        );
    }

    return (
        <SpaceBackground>
            {/* Floating brain particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {brainParticles.map((particle, i) => (
                    <div
                        key={i}
                        className="absolute text-3xl opacity-30"
                        style={{
                            left: `${5 + i * 12}%`,
                            top: `${15 + (i % 4) * 20}%`,
                            animation: `float ${3 + i * 0.4}s ease-in-out infinite`,
                            animationDelay: `${i * 0.25}s`
                        }}
                    >
                        {particle}
                    </div>
                ))}
            </div>

            {/* Back button */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all z-30"
            >
                <span className="text-xl">←</span>
                <span className="text-white font-medium">Back</span>
            </button>

            <div className="flex flex-col items-center justify-center min-h-full px-4 py-6 relative z-10">
                {/* Animated Brain Mascot */}
                <div className="text-center mb-6">
                    <div
                        className="text-7xl mb-2 inline-block"
                        style={{ animation: 'float 2s ease-in-out infinite' }}
                    >
                        🧠
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl animate-pulse">💡</span>
                        <span className="text-2xl animate-pulse" style={{ animationDelay: '0.3s' }}>⚡</span>
                        <span className="text-2xl animate-pulse" style={{ animationDelay: '0.6s' }}>✨</span>
                    </div>
                </div>

                {/* Title with gradient */}
                <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-center">
                    <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
                        Brain Training
                    </span>
                </h1>
                <p className="text-purple-200 mb-6 text-center">
                    Power up your thinking skills! 🚀
                </p>

                {/* Skills badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    <span className="bg-purple-500/30 border border-purple-400/50 px-3 py-1 rounded-full text-sm text-purple-200">
                        🧩 Patterns
                    </span>
                    <span className="bg-emerald-500/30 border border-emerald-400/50 px-3 py-1 rounded-full text-sm text-emerald-200">
                        🔍 Logic
                    </span>
                    <span className="bg-amber-500/30 border border-amber-400/50 px-3 py-1 rounded-full text-sm text-amber-200">
                        🧠 Memory
                    </span>
                </div>

                {/* Game tiles grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
                    {SKILL_GAMES.map((game, index) => {
                        const unlocked = isUnlocked(game);
                        return (
                            <button
                                key={game.id}
                                onClick={() => unlocked && handleGameClick(game)}
                                disabled={!unlocked}
                                className={`
                                bg-gradient-to-br ${game.color} 
                                p-5 rounded-2xl shadow-xl 
                                transition-all duration-300 
                                text-left 
                                border-2 border-white/20
                                group
                                focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50
                                ${unlocked ? 'hover:scale-105 hover:shadow-2xl cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'}
                            `}
                                style={{
                                    animation: `slideIn 0.4s ease-out ${index * 0.1}s both`
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="text-5xl group-hover:scale-125 transition-transform duration-300"
                                        style={{
                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                        }}
                                    >
                                        {game.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-1">
                                            {game.title}
                                        </h3>
                                        <p className="text-white/80 text-sm">
                                            {game.description}
                                        </p>
                                    </div>
                                    <div className="text-2xl opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                        →
                                    </div>
                                </div>

                                {/* Difficulty badge */}
                                <div className="mt-3 flex items-center gap-2">
                                    <span className={`
                                    px-2 py-0.5 rounded-full text-xs font-medium
                                    ${game.difficulty === 'Easy' ? 'bg-green-400/30 text-green-100' : ''}
                                    ${game.difficulty === 'Medium' ? 'bg-yellow-400/30 text-yellow-100' : ''}
                                    ${game.difficulty === 'Hard' ? 'bg-red-400/30 text-red-100' : ''}
                                `}>
                                        {game.difficulty === 'Easy' && '🌱'}
                                        {game.difficulty === 'Medium' && '🌟'}
                                        {game.difficulty === 'Hard' && '🔥'}
                                        {' '}{game.difficulty}
                                    </span>
                                </div>

                                {!unlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl">
                                        <div className="text-4xl">🔒</div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Coming soon teaser */}
                <div className="mt-8 text-center">
                    <p className="text-purple-300 text-sm">
                        More brain games coming soon! 🎉
                    </p>
                    <div className="flex justify-center gap-2 mt-2 opacity-50">
                        <span className="text-2xl">🧠</span>
                        <span className="text-2xl">🃏</span>
                        <span className="text-2xl">🤖</span>
                        <span className="text-2xl">📊</span>
                    </div>
                </div>
            </div>

            {/* CSS for animations */}
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </SpaceBackground>
    );
};

export default BrainTrainingPage;
