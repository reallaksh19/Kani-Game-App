import React from 'react';
import { Question, Feedback } from '../types';

interface VocabularyRendererProps {
    gameId: string;
    currentQ: Question;
    showHint: boolean;
    safeHint: string;
    safeExplanation: string;
    handleAnswer: (answer: string, correctAnswer: string) => void;
    feedback: Feedback | null;
    safeAnswer: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export const VocabularyRenderer: React.FC<VocabularyRendererProps> = ({
    gameId,
    currentQ,
    showHint,
    safeHint,
    safeExplanation,
    handleAnswer,
    feedback,
    safeAnswer
}) => {
    // Word Wizard - Context clues game
    if (gameId === 'word-wizard') {
        const options = shuffleArray([safeAnswer, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[]);
        return (
            <div className="w-full max-w-lg relative animate-slideIn">
                <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl">
                    <div className="text-indigo-300 text-sm mb-3">🧙 What word completes the sentence?</div>
                    <div className="text-white text-xl leading-relaxed mb-4">"{currentQ.text1}"</div>
                    {currentQ.text2 && <div className="text-gray-400 text-sm italic">{currentQ.text2}</div>}
                    {showHint && safeHint && <p className="text-gray-400 text-sm mt-3">💡 {safeHint}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 relative z-20">
                    {options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswer(opt, safeAnswer)}
                            className={`p-4 rounded-xl text-lg font-bold transition-all cursor-pointer ${feedback
                                ? (opt === safeAnswer ? 'bg-green-500 text-white scale-105' : 'bg-gray-700 text-gray-400')
                                : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:scale-105 hover:shadow-lg'
                            }`}>{opt}</button>
                    ))}
                </div>
                {safeExplanation && (
                    <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur animate-slideIn">
                        <h3 className="text-yellow-400 font-bold mb-1">💡 Word Power</h3>
                        <p className="text-white text-sm">{safeExplanation}</p>
                    </div>
                )}
            </div>
        );
    }

    // Root Raider - Greek/Latin roots
    if (gameId === 'root-raider') {
        const options = shuffleArray([safeAnswer, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[]);
        return (
            <div className="w-full max-w-lg relative animate-slideIn">
                <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl">
                    <div className="text-green-300 text-sm mb-3">🌳 What does this root mean?</div>
                    <div className="bg-green-500/20 border-2 border-green-400/50 rounded-xl p-4 mb-4">
                        <div className="text-white text-4xl font-bold font-mono">{currentQ.text1}</div>
                    </div>
                    {currentQ.text2 && <div className="text-gray-300 text-sm">Example: <span className="text-green-300">{currentQ.text2}</span></div>}
                    {showHint && safeHint && <p className="text-gray-400 text-sm mt-3">💡 {safeHint}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 relative z-20">
                    {options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswer(opt, safeAnswer)}
                            className={`p-4 rounded-xl text-lg font-bold transition-all cursor-pointer ${feedback
                                ? (opt === safeAnswer ? 'bg-green-500 text-white scale-105' : 'bg-gray-700 text-gray-400')
                                : 'bg-gradient-to-r from-green-600 to-teal-500 text-white hover:scale-105'
                            }`}>{opt}</button>
                    ))}
                </div>
            </div>
        );
    }

    // Idiom Island - Idiom meanings
    if (gameId === 'idiom-island') {
        const options = shuffleArray([safeAnswer, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[]);
        return (
            <div className="w-full max-w-lg relative animate-slideIn">
                <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl">
                    <div className="text-orange-300 text-sm mb-3">🏝️ What does this idiom mean?</div>
                    <div className="relative bg-orange-500/20 rounded-2xl p-6 mb-4">
                        <div className="absolute -top-3 left-4 text-4xl">💬</div>
                        <div className="text-white text-2xl font-medium italic">"{currentQ.text1}"</div>
                    </div>
                    {showHint && safeHint && <p className="text-gray-400 text-sm">💡 {safeHint}</p>}
                </div>
                <div className="grid grid-cols-1 gap-3 relative z-20">
                    {options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswer(opt, safeAnswer)}
                            className={`p-4 rounded-xl text-lg font-bold transition-all cursor-pointer text-left ${feedback
                                ? (opt === safeAnswer ? 'bg-green-500 text-white scale-102' : 'bg-gray-700 text-gray-400')
                                : 'bg-gradient-to-r from-orange-500 to-yellow-400 text-white hover:scale-102 hover:translate-x-2'
                            }`}>{opt}</button>
                    ))}
                </div>
            </div>
        );
    }

    // Homophone Hunt - Sound-alike words
    if (gameId === 'homophone-hunt') {
        // Options shouldn't be shuffled for homophone hunt to keep them consistent if order matters,
        // but prompt snippet said: const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
        const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
        return (
            <div className="w-full max-w-lg relative animate-slideIn">
                <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl">
                    <div className="text-pink-300 text-sm mb-3">👂 Choose the correct word!</div>
                    <div className="text-white text-xl leading-relaxed">
                        {(currentQ.text1 || '').split('_____').map((part, i, arr) => (
                            <span key={i}>
                                {part}
                                {i < arr.length - 1 && <span className="text-yellow-400 text-2xl animate-pulse mx-1">____</span>}
                            </span>
                        ))}
                    </div>
                    {showHint && safeHint && <p className="text-gray-400 text-sm mt-4">💡 {safeHint}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 relative z-20">
                    {options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswer(opt, safeAnswer)}
                            className={`p-4 rounded-xl text-xl font-bold transition-all cursor-pointer ${feedback
                                ? (opt === safeAnswer ? 'bg-green-500 text-white scale-105' : 'bg-gray-700 text-gray-400')
                                : 'bg-gradient-to-r from-pink-500 to-red-400 text-white hover:scale-105'
                            }`}>{opt}</button>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};
