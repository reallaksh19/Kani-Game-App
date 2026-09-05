import React, { useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { StarIcon } from '../shared/StarIcon';
import { LeaderboardEntry } from '../../types';
import { MATH_GAMES, ALL_GAMES } from '../../data/gameDefinitions';

interface LeaderboardPageProps {
    onBack: () => void;
    leaderboard: LeaderboardEntry[];
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onBack, leaderboard }) => {
    const [filter, setFilter] = useState('all');
    const filtered = filter === 'all' ? leaderboard : leaderboard.filter(s => filter === 'math' ? MATH_GAMES.find(g => g.id === s.game) : !MATH_GAMES.find(g => g.id === s.game));
    const sorted = [...filtered].sort((a, b) => b.stars - a.stars).slice(0, 10);

    return (
        <SpaceBackground>
            <div className="flex flex-col items-center h-full pt-8 px-4 overflow-y-auto">
                <button onClick={onBack} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gray-900/80 flex items-center justify-center text-white hover:bg-gray-700 z-20 cursor-pointer">←</button>
                <h1 className="text-4xl font-bold text-white mb-6">🏆 Leaderboard</h1>
                <div className="flex gap-2 mb-6 relative z-20">
                    {['all', 'math', 'english'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full font-bold capitalize cursor-pointer ${filter === f ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{f}</button>
                    ))}
                </div>
                <div className="w-full max-w-md bg-gray-900/80 rounded-2xl p-4 backdrop-blur relative z-20">
                    {sorted.length === 0 ? <p className="text-center text-gray-400 py-8">No scores yet!</p> : (
                        <div className="space-y-2">
                            {sorted.map((score, i) => {
                                const gameInfo = ALL_GAMES.find(g => g.id === score.game);
                                return (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? 'bg-yellow-500/20' : 'bg-gray-800/50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>{i + 1}</div>
                                        <div className="flex-1"><div className="text-white font-bold">{score.name}</div><div className="text-gray-400 text-xs">{gameInfo?.title}</div></div>
                                        <div className="flex items-center gap-1 text-yellow-400 font-bold"><StarIcon className="w-4 h-4" />{score.stars}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </SpaceBackground>
    );
};
