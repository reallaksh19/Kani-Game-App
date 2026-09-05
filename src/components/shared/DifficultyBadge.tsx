import React from 'react';
import { Difficulty } from '../../types';
import { DIFFICULTY_COLORS } from '../../themes/themeConfig';

interface DifficultyBadgeProps {
    difficulty: Difficulty;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
    if (difficulty === 'None') return null;

    // Fallback if somehow an invalid difficulty is passed, though types prevent it mostly
    const colors = DIFFICULTY_COLORS[difficulty] || { bg: 'bg-gray-500', text: 'text-white' };

    return (
        <span className={`${colors.bg} text-white text-xs px-2 py-1 rounded-full font-bold`}>
            {difficulty}
        </span>
    );
};
