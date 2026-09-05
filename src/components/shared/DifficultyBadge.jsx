import React from 'react';
import { DIFFICULTY_COLORS } from '../../themes/themeConfig';

export const DifficultyBadge = ({ difficulty }) => {
  const config = DIFFICULTY_COLORS[difficulty] || { bg: 'bg-gray-500' };

  return (
    <span className={`${config.bg} text-white text-xs px-2 py-1 rounded-full font-bold`}>
      {difficulty}
    </span>
  );
};

export default DifficultyBadge;
