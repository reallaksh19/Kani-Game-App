import React, { useState, useEffect } from 'react';
import { Question, Feedback, ThemeConfig } from '../types';

interface StoryJammerRendererProps {
    currentQ: Question;
    handleAnswer: (selected: string, correct?: string) => void;
    feedback: Feedback | null;
    gameTheme: ThemeConfig;
    questionIndex: number; // To decide if we auto-expand story
}

export const StoryJammerRenderer: React.FC<StoryJammerRendererProps> = ({
    currentQ,
    handleAnswer,
    feedback,
    gameTheme,
    questionIndex
}) => {
    // Local state for story collapse/expand
    const [isStoryExpanded, setIsStoryExpanded] = useState(true);

    // Auto-collapse after first question (if index > 0)
    useEffect(() => {
        if (questionIndex > 0) {
            setIsStoryExpanded(false);
        } else {
            setIsStoryExpanded(true);
        }
    }, [questionIndex, currentQ.story_id]);

    const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];

    // Map question types to labels and colors
    const questionType = (currentQ.question_type || 'literal').toLowerCase();

    const questionTypeLabels: Record<string, string> = {
        literal: '📖 Find the Answer',
        inferential: '🔍 Think Deeper',
        inference: '🔍 Think Deeper', // Handle variations
        vocabulary: '📚 Word Meaning',
        summarization: '💡 Main Idea'
    };

    const questionTypeBadge: Record<string, string> = {
        literal: 'bg-blue-500',
        inferential: 'bg-purple-500',
        inference: 'bg-purple-500',
        vocabulary: 'bg-green-500',
        summarization: 'bg-orange-500'
    };

    return (
        <div className="w-full max-w-4xl animate-slideIn flex flex-col items-center">
            {/* Story Passage */}
            <div className={`w-full ${gameTheme.cardBg} backdrop-blur-md rounded-2xl border-2 ${gameTheme.borderColor} shadow-xl transition-all duration-500 overflow-hidden mb-6`}>
                <div
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5"
                    onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                >
                    <h3 className={`${gameTheme.storyTitleColor} font-bold text-xl flex items-center gap-2`}>
                        <span>📜</span> Story Passage
                    </h3>
                    <span className="text-white/70 text-sm">
                        {isStoryExpanded ? 'Tap to collapse ▲' : 'Tap to read ▼'}
                    </span>
                </div>

                {isStoryExpanded && (
                    <div className="p-6 pt-0 animate-fadeIn border-t border-white/10">
                        <div className="text-white text-lg leading-loose font-medium font-sans">
                            {currentQ.passage || currentQ.text2}
                        </div>
                    </div>
                )}
            </div>

            {/* Question Area */}
            <div className="w-full max-w-2xl">
                {/* Question Type Badge */}
                <div className="flex justify-center mb-4">
                    <div className={`px-4 py-1 rounded-full text-white text-sm font-bold shadow-lg ${questionTypeBadge[questionType] || 'bg-gray-500'}`}>
                        {questionTypeLabels[questionType] || 'Question'}
                    </div>
                </div>

                {/* Question Text */}
                <div className={`${gameTheme.questionBg} backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 ${gameTheme.borderColor} shadow-lg text-center`}>
                    <div className="text-white text-2xl font-bold leading-relaxed">
                        {currentQ.text1}
                    </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 gap-3 relative z-20">
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(opt, currentQ.answer)}
                            disabled={!!feedback}
                            className={`p-5 rounded-xl text-lg text-left font-semibold transition-all transform hover:scale-102 hover:shadow-xl flex items-center gap-4 ${
                                feedback
                                    ? (opt === currentQ.answer
                                        ? 'bg-green-500 text-white border-2 border-green-300 ring-2 ring-green-400/50'
                                        : 'bg-gray-700 text-gray-400 opacity-50')
                                    : `${gameTheme.buttonBg} text-white border-2 ${gameTheme.borderColor} hover:brightness-110`
                            }`}
                        >
                            <span className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-sm font-bold shrink-0">
                                {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
