import React from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { GRAMMAR_GAMES, VOCABULARY_GAMES, COMPREHENSION_GAMES } from '../../data/gameDefinitions';

interface EnglishLandingPageProps {
    onSelectCategory: (category: string) => void;
    onBack: () => void;
    totalStars: number;
}

export const EnglishLandingPage: React.FC<EnglishLandingPageProps> = ({ onSelectCategory, onBack }) => (
    <SpaceBackground variant="english">
        <div className="flex flex-col items-center justify-center h-full px-4">
            <button onClick={onBack} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gray-900/80 flex items-center justify-center text-white hover:bg-gray-700 z-20 cursor-pointer">←</button>
            <h1 className="text-5xl font-bold text-white mb-8">📚 English Galaxy</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full relative z-20">
                {[
                    { id: 'grammar', icon: '✏️', title: 'Grammar', color: 'from-purple-600 to-indigo-700', count: GRAMMAR_GAMES.length },
                    { id: 'vocabulary', icon: '📖', title: 'Vocabulary', color: 'from-green-600 to-emerald-700', count: VOCABULARY_GAMES.length },
                    { id: 'comprehension', icon: '🔍', title: 'Comprehension', color: 'from-teal-600 to-cyan-700', count: COMPREHENSION_GAMES.length },
                ].map(cat => (
                    <button key={cat.id} onClick={() => onSelectCategory(cat.id)} className={`bg-gradient-to-br ${cat.color} p-6 rounded-3xl shadow-2xl hover:scale-105 transition-all text-left cursor-pointer`}>
                        <div className="text-5xl mb-3">{cat.icon}</div>
                        <h2 className="text-2xl font-bold text-white mb-1">{cat.title}</h2>
                        <p className="text-white/70 text-sm">{cat.count} games</p>
                    </button>
                ))}
            </div>
        </div>
    </SpaceBackground>
);
