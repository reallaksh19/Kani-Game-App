import React from 'react';
import { StarIcon } from './StarIcon';

interface GameOverScreenProps {
    stars: number;
    streak: number;
    onRestart: () => void;
    onBack: () => void;
    onSaveScore: () => void;
    playerName: string;
    setPlayerName: (name: string) => void;
    scoreSaved: boolean;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ stars, streak, onRestart, onBack, onSaveScore, playerName, setPlayerName, scoreSaved }) => {
    const getFeedback = () => {
        if (stars >= 150) return { title: 'Galaxy Guardian', icon: '🛡️', color: 'text-fuchsia-400', msg: 'Out of this World! 🌟' };
        if (stars >= 100) return { title: 'Space Explorer', icon: '🚀', color: 'text-blue-400', msg: 'Awesome Job! 🚀' };
        if (stars >= 50) return { title: 'Star Catcher', icon: '⭐', color: 'text-yellow-400', msg: 'Great Effort! ✨' };
        return { title: 'Rookie Pilot', icon: '🧑‍🚀', color: 'text-emerald-400', msg: 'Good Try! 🌱' };
    };

    const { title, icon, color, msg } = getFeedback();

    return (
        <div className="text-center bg-gray-900/80 p-8 rounded-2xl backdrop-blur max-w-sm mx-4 relative z-30 border border-white/10 shadow-2xl animate-scaleIn">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl drop-shadow-lg animate-bounce">{icon}</div>
            <h2 className="text-4xl font-bold text-white mb-2 mt-8">Game Over!</h2>

            <p className={`text-xl font-bold mb-4 ${color}`}>{title}</p>
            <p className="text-white text-lg italic mb-6">"{msg}"</p>

            <div className="flex items-center justify-center gap-2 mb-2 bg-black/30 rounded-xl p-4">
                <StarIcon className="w-8 h-8 text-yellow-400" />
                <span className="text-4xl font-bold text-yellow-400">{stars}</span>
            </div>
            <p className="text-purple-300 mb-6 text-sm">Best Streak: <span className="text-white font-bold">{streak}</span></p>

            {!scoreSaved && (
                <div className="mb-6">
                <input type="text" placeholder="Enter your name" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none w-full mb-2" maxLength={20} />
                <button onClick={onSaveScore} disabled={!playerName.trim()}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50 w-full cursor-pointer">Save Score</button>
            </div>
        )}
        {scoreSaved && <p className="text-green-400 mb-6">✓ Score saved!</p>}
        <div className="flex gap-4 justify-center">
            <button onClick={onBack} className="bg-gray-600 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-500 cursor-pointer">HOME</button>
            <button onClick={onRestart} className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform cursor-pointer">PLAY AGAIN</button>
        </div>
        </div>
    );
};
