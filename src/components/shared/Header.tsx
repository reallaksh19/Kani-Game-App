import React from 'react';
import { Difficulty } from '../../types';
import { StarIcon } from './StarIcon';
import { DifficultyBadge } from './DifficultyBadge';

interface HeaderProps {
  timer: number;
  streak: number;
  stars: number;
  onBack: () => void;
  formatTime: (s: number) => string;
  difficulty: Difficulty;
  progress?: { current: number; total: number };
  hintCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ timer, streak, stars, onBack, formatTime, difficulty, progress, hintCount }) => (
  <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
    <div className="flex items-center gap-4">
      <button onClick={onBack} aria-label="Back" className="w-10 h-10 rounded-full bg-gray-900/80 flex items-center justify-center text-white hover:bg-gray-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white">←</button>
      <div className="flex items-center bg-gray-900/80 rounded-lg p-2 backdrop-blur">
        <div>
          <div className="text-xl font-bold text-white">{formatTime(timer)}</div>
          <div className="text-xs text-blue-300">TIMER</div>
        </div>
        <div className="ml-3 border-l border-gray-600 pl-3">
          <div className="text-xl font-bold text-orange-400">{streak}</div>
          <div className="text-xs text-orange-300">STREAK</div>
        </div>
        {hintCount !== undefined && (
          <div className="ml-3 border-l border-gray-600 pl-3 text-center min-w-[60px]">
            <div className="text-xl font-bold text-yellow-400">{hintCount}</div>
            <div className="text-xs text-yellow-300 flex items-center justify-center gap-1">
              <span>💡</span> HINT
            </div>
          </div>
        )}
        {progress && (
          <div className="ml-3 border-l border-gray-600 pl-3 flex flex-col justify-center min-w-[120px]">
            <div className="flex justify-between text-xs text-emerald-300 mb-1">
              <span className="font-bold">PROGRESS</span>
              <span className="font-bold">{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
        {difficulty && <div className="ml-3 border-l border-gray-600 pl-3"><DifficultyBadge difficulty={difficulty} /></div>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-l-full font-bold flex items-center gap-1"><StarIcon className="w-4 h-4" /></div>
      <div className="bg-gray-200 text-gray-800 px-4 py-1 rounded-r-full font-bold min-w-16 text-center">{stars}</div>
    </div>
  </div>
);
