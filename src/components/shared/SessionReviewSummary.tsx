import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { SvgDiagramRenderer } from './SvgDiagramRenderer';
import { StarIcon } from './StarIcon';

interface AnswerRecord {
    selected: string;
    isCorrect: boolean;
    timeSpent?: number;
}

interface SessionReviewSummaryProps {
    title?: string;
    questions: Question[];
    answers: Record<number, AnswerRecord>;
    stars: number;
    streak: number;
    totalTime: number;
    playerName: string;
    setPlayerName: (name: string) => void;
    scoreSaved: boolean;
    onSaveScore: () => void;
    onRestart: () => void;
    onBack: () => void;
}

export const SessionReviewSummary: React.FC<SessionReviewSummaryProps> = ({
    title = 'Thinksheet Review',
    questions,
    answers,
    stars,
    streak,
    totalTime,
    playerName,
    setPlayerName,
    scoreSaved,
    onSaveScore,
    onRestart,
    onBack,
}) => {
    const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct'>('all');
    const [collapsedIds, setCollapsedIds] = useState<Record<number, boolean>>({});
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Scroll to top immediately when summary loads
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const scrollParents = document.querySelectorAll('.overflow-y-auto');
        scrollParents.forEach(el => {
            el.scrollTop = 0;
        });

        const handleScroll = () => {
            const container = document.querySelector('.overflow-y-auto') || window;
            const currentY = 'scrollTop' in container ? (container as HTMLElement).scrollTop : window.scrollY;
            setShowScrollTop(currentY > 300);
        };

        const targetContainer = document.querySelector('.overflow-y-auto');
        if (targetContainer) {
            targetContainer.addEventListener('scroll', handleScroll);
            return () => targetContainer.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const scrollContainer = document.querySelector('.overflow-y-auto');
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const totalQuestions = questions.length;
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const attemptedCount = Object.keys(answers).length;
    const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const toggleCollapse = (idx: number) => {
        setCollapsedIds(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const filteredQuestions = questions.map((q, idx) => ({ q, idx })).filter(({ idx }) => {
        const ans = answers[idx];
        if (filter === 'correct') return ans?.isCorrect === true;
        if (filter === 'incorrect') return ans && ans.isCorrect === false;
        return true;
    });

    const formatTime = (seconds?: number) => {
        if (!seconds && seconds !== 0) return '--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${String(secs).padStart(2, '0')}s`;
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fadeIn pb-24 text-gray-800">
            {/* Top Header Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-purple-200 overflow-hidden mb-8">
                {/* Purple Banner */}
                <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white px-6 py-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-purple-200 font-bold">LogIQids Champ · Olympiad</div>
                        <h1 className="text-2xl sm:text-3xl font-black">{title}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold backdrop-blur transition-all cursor-pointer"
                        >
                            ← Hub
                        </button>
                        <button
                            onClick={onRestart}
                            className="bg-amber-400 hover:bg-amber-300 text-gray-900 px-5 py-2 rounded-xl text-sm font-black shadow-lg hover:scale-105 transition-all cursor-pointer"
                        >
                            Play Again ↻
                        </button>
                    </div>
                </div>

                {/* Performance Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-purple-50/50 border-b border-purple-100">
                    <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Score</span>
                        <div className="flex items-center gap-1 mt-1">
                            <StarIcon className="w-6 h-6 text-amber-500" />
                            <span className="text-2xl font-black text-purple-950">{stars}</span>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accuracy</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1">{accuracyPercent}%</span>
                        <span className="text-[11px] font-semibold text-gray-400">{correctCount} of {totalQuestions} right</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Time</span>
                        <span className="text-2xl font-black text-indigo-950 mt-1">{formatTime(totalTime)}</span>
                        <span className="text-[11px] font-semibold text-gray-400">Total duration</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Best Streak</span>
                        <span className="text-2xl font-black text-amber-600 mt-1">🔥 {streak}</span>
                        <span className="text-[11px] font-semibold text-gray-400">In a row</span>
                    </div>
                </div>

                {/* Score Saver */}
                <div className="p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-gray-600">
                        Review each question below to understand the solution and sharpen your thinking!
                    </div>
                    {!scoreSaved ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Enter pilot name"
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                                maxLength={20}
                                className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 text-gray-800 w-full sm:w-48"
                            />
                            <button
                                onClick={onSaveScore}
                                disabled={!playerName.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap"
                            >
                                Save Score
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            ✓ Score saved on leaderboard!
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Tabs & View Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            filter === 'all'
                                ? 'bg-[#5c4fd6] text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        All Questions ({totalQuestions})
                    </button>
                    <button
                        onClick={() => setFilter('incorrect')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            filter === 'incorrect'
                                ? 'bg-rose-600 text-white shadow-md'
                                : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50'
                        }`}
                    >
                        Needs Review ({attemptedCount - correctCount})
                    </button>
                    <button
                        onClick={() => setFilter('correct')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            filter === 'correct'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50'
                        }`}
                    >
                        Correct ({correctCount})
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            const newCollapsed: Record<number, boolean> = {};
                            questions.forEach((_, i) => { newCollapsed[i] = false; });
                            setCollapsedIds(newCollapsed);
                        }}
                        className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                    >
                        Expand All ⌃
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const newCollapsed: Record<number, boolean> = {};
                            questions.forEach((_, i) => { newCollapsed[i] = true; });
                            setCollapsedIds(newCollapsed);
                        }}
                        className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl border border-gray-300 transition-colors cursor-pointer"
                    >
                        Collapse All ⌄
                    </button>
                </div>
            </div>

            {/* Question Cards List */}
            <div className="space-y-6">
                {filteredQuestions.map(({ q, idx }) => {
                    const ans = answers[idx];
                    const isAnswered = !!ans;
                    const isCorrect = ans?.isCorrect;
                    const selectedOption = ans?.selected;
                    const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean) as string[];
                    const selectedIndex = selectedOption ? options.indexOf(selectedOption) : -1;
                    const selectedLetter = selectedIndex >= 0 ? String.fromCharCode(65 + selectedIndex) : '';
                    const isCollapsed = !!collapsedIds[idx];

                    return (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl overflow-hidden shadow-md border border-purple-200 transition-all hover:shadow-lg"
                        >
                            {/* Blue Header Section Bar */}
                            <div className="bg-[#5c4fd6] text-white px-6 py-2.5 text-center font-bold text-sm tracking-wide flex items-center justify-between">
                                <span className="text-xs uppercase tracking-wider text-purple-200 font-semibold">
                                    LQ Champ Section
                                </span>
                                <span className="text-xs font-semibold text-purple-200">
                                    Question {idx + 1} of {totalQuestions}
                                </span>
                            </div>

                            <div className="p-6">
                                {/* Meta Row: Category Badge & Difficulty Dot */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="bg-[#ede9fe] text-[#4f46e5] text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                                        {q.text2 || 'Logical Reasoning'}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                        <span className={q.difficulty === 'Hard' ? 'text-red-500' : 'text-amber-500'}>●</span>
                                        <span className={q.difficulty === 'Hard' ? 'text-red-600' : 'text-amber-700'}>
                                            {q.difficulty || 'Medium'}
                                        </span>
                                    </div>
                                </div>

                                {/* Question Title and Collapse Toggle */}
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-black text-indigo-950">
                                        Question {idx + 1}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => toggleCollapse(idx)}
                                        className="text-gray-400 hover:text-indigo-600 font-bold p-1 rounded-lg transition-colors cursor-pointer"
                                        title={isCollapsed ? 'Expand Question' : 'Collapse Question'}
                                    >
                                        <span className="text-lg select-none">{isCollapsed ? '⌄' : '⌃'}</span>
                                    </button>
                                </div>

                                {/* Question Body */}
                                {!isCollapsed && (
                                    <>
                                        {/* Question Prompt */}
                                        <div className="text-gray-900 text-lg font-medium leading-relaxed mb-4 whitespace-pre-line">
                                            {q.text1}
                                        </div>

                                        {/* Diagram (SVG or Image) */}
                                        {q.image_url && (
                                            <div className="mb-4">
                                                <SvgDiagramRenderer url={q.image_url} />
                                            </div>
                                        )}

                                        {/* Answer Status & Time Bar (Genuine recorded data only) */}
                                        <div className="flex flex-wrap items-center gap-3 py-2 border-y border-gray-100 my-4 text-xs font-bold text-gray-500">
                                            {isAnswered ? (
                                                <span
                                                    className={`px-3 py-1 rounded-full font-extrabold flex items-center gap-1.5 ${
                                                        isCorrect
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                                                    }`}
                                                >
                                                    Your Answer: {selectedLetter ? `${selectedLetter}. ` : ''}{selectedOption}
                                                    <span>{isCorrect ? '✓' : '✖'}</span>
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full font-bold bg-gray-100 text-gray-600 border border-gray-300">
                                                    Not Attempted
                                                </span>
                                            )}

                                            <span className="flex items-center gap-1 text-gray-500">
                                                <span>⏱️ Your Time:</span>
                                                <span className="font-bold text-gray-700">{formatTime(ans?.timeSpent)}</span>
                                            </span>
                                        </div>

                                        {/* Options Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                                            {options.map((opt, optIdx) => {
                                                const letter = String.fromCharCode(65 + optIdx);
                                                const isThisSelected = opt === selectedOption;
                                                const isThisCorrect = opt === q.answer || opt === String(q.answer);

                                                let style = 'bg-[#f8f9fc] border border-gray-200 text-gray-700';
                                                let icon = null;

                                                if (isThisCorrect) {
                                                    // Green background + border for correct answer
                                                    style = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold';
                                                    icon = <span className="text-emerald-600 font-black text-sm">✓</span>;
                                                } else if (isThisSelected && !isCorrect) {
                                                    // Red background + border for user's wrong answer (matching screenshot)
                                                    style = 'bg-rose-50 border-2 border-rose-400 text-rose-950 font-bold';
                                                    icon = (
                                                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black">
                                                            ✕
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={optIdx}
                                                        className={`px-4 py-3 rounded-2xl flex items-center justify-between text-sm transition-all ${style}`}
                                                    >
                                                        <span>
                                                            <strong className="mr-2 text-indigo-900">{letter}.</strong> {opt}
                                                        </span>
                                                        {icon}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Solution Box (matching LogIQids screenshot) */}
                                        <div className="p-4 bg-[#f8f7ff] border border-purple-100 rounded-2xl">
                                            <div className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                                                Solution :
                                            </div>
                                            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line font-medium">
                                                {q.explanation || q.know_more || 'Analyze the relationship between each element to verify the answer.'}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                    onClick={onBack}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-3.5 rounded-full shadow-lg transition-all cursor-pointer"
                >
                    ← Back to Hub
                </button>
                <button
                    onClick={onRestart}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black px-10 py-3.5 rounded-full shadow-xl hover:scale-105 transition-all cursor-pointer"
                >
                    Play Again ↻
                </button>
            </div>

            {/* Floating Back to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-40 bg-[#5c4fd6] hover:bg-[#4d3fc0] text-white px-4 py-3 rounded-full shadow-2xl transition-all cursor-pointer flex items-center gap-1.5 font-black text-xs hover:scale-105"
                    title="Scroll to Top"
                >
                    <span>↑</span>
                    <span>Top</span>
                </button>
            )}
        </div>
    );
};

export default SessionReviewSummary;
