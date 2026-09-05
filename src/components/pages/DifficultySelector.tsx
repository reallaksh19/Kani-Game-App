import React from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Settings, Difficulty } from '../../types';
import { ALL_GAMES } from '../../data/gameDefinitions';

interface DifficultySelectorProps {
    game: string;
    onSelect: (difficulty: Difficulty) => void;
    onBack: () => void;
    settings: Settings;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({ game, onSelect, onBack, settings }) => {
    const gameInfo = ALL_GAMES.find(g => g.id === game);
    const lockedDifficulty = settings?.defaultDifficulty && settings.defaultDifficulty !== 'None' ? settings.defaultDifficulty : null;

    return (
        <SpaceBackground variant="math">
            <div className="flex flex-col items-center justify-center h-full px-4">
                <button onClick={onBack} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gray-900/80 flex items-center justify-center text-white hover:bg-gray-700 z-20 cursor-pointer">←</button>
                <div className="text-6xl mb-4">{gameInfo?.icon}</div>
                <h1 className="text-4xl font-bold text-white mb-4">{gameInfo?.title}</h1>
                {lockedDifficulty && <p className="text-purple-300 mb-4 text-sm">Difficulty locked to {lockedDifficulty} in settings</p>}
                <div className="flex flex-col gap-4 w-full max-w-xs relative z-20">
                    {['Easy', 'Medium', 'Hard'].map(diff => {
                        const isDisabled = !!(lockedDifficulty && lockedDifficulty !== diff);
                        return (
                            <button
                                key={diff}
                                onClick={() => !isDisabled && onSelect(diff as Difficulty)}
                                disabled={isDisabled}
                                className={`p-4 rounded-2xl text-left transition-all cursor-pointer ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'} ${diff === 'Easy' ? 'bg-gradient-to-r from-green-500 to-green-600' : diff === 'Medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                            >
                                <div className="text-xl font-bold text-white">{diff}</div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </SpaceBackground>
    );
};
