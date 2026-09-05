import React, { useMemo, useState } from 'react';
import { Question } from '../../types';
import { Badge } from '../../utils/playerStats';
import { StarIcon } from './StarIcon';
import { SvgDiagramRenderer } from './SvgDiagramRenderer';

interface AnswerRecord { selected: string; isCorrect: boolean; timeSpent?: number; }
interface Props {
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
    newBadges?: Badge[];
}

type Filter = 'all' | 'review' | 'correct' | 'skipped';
const formatTime = (seconds?: number) => {
    if (seconds === undefined) return '--';
    const s = Math.max(0, Math.round(seconds));
    return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
};
const weight = (q: Question) => q.difficulty === 'Hard' ? 8 : 4;

export const SessionReviewSummary: React.FC<Props> = ({
    title = 'Thinksheet Review', questions, answers, stars, streak, totalTime,
    playerName, setPlayerName, scoreSaved, onSaveScore, onRestart, onBack, newBadges = []
}) => {
    const [filter, setFilter] = useState<Filter>('all');
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

    const stats = useMemo(() => {
        const correct = Object.values(answers).filter(a => a.isCorrect).length;
        const attempted = Object.keys(answers).length;
        const total = questions.length;
        const reviewScore = questions.reduce((sum, q, i) => sum + (answers[i]?.isCorrect ? weight(q) : 0), 0);
        const maxScore = questions.reduce((sum, q) => sum + weight(q), 0);
        return {
            correct, attempted, total, reviewScore, maxScore,
            wrong: attempted - correct,
            skipped: total - attempted,
            accuracy: total ? Math.round(correct * 100 / total) : 0,
        };
    }, [answers, questions]);

    const visible = questions.map((question, index) => ({ question, index })).filter(({ index }) => {
        const a = answers[index];
        if (filter === 'correct') return a?.isCorrect;
        if (filter === 'review') return !a || !a.isCorrect;
        if (filter === 'skipped') return !a;
        return true;
    });

    const setAll = (value: boolean) => setCollapsed(Object.fromEntries(questions.map((_, i) => [i, value])));

    return (
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-5 py-5 pb-24 text-slate-900">
            <section className="overflow-hidden rounded-[28px] border border-violet-200 bg-white shadow-2xl mb-6">
                <div className="bg-gradient-to-r from-[#4f46e5] via-[#5c4fd6] to-[#7c3aed] px-5 sm:px-7 py-6 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-100">LQ Champ · Grade 4 · Post-Game Review</div>
                            <h1 className="mt-1 text-2xl sm:text-4xl font-black">{title}</h1>
                            <p className="mt-1 text-sm text-violet-100">Review every answer, time taken, visual clue and worked solution.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={onRestart} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-black text-slate-950 shadow hover:bg-amber-200 cursor-pointer">↻ Play Again</button>
                            <button onClick={onBack} className="rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-black hover:bg-white/25 cursor-pointer">Thinksheet Hub</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 bg-violet-50 p-4 sm:p-6">
                    {[
                        ['Review Score', `${stats.reviewScore}/${stats.maxScore}`, 'Medium 4 · Hard 8'],
                        ['Accuracy', `${stats.accuracy}%`, `${stats.correct}/${stats.total} correct`],
                        ['Correct', `${stats.correct}/${stats.total}`, `${stats.wrong} wrong · ${stats.skipped} skipped`],
                        ['Total Time', formatTime(totalTime), `Best streak 🔥 ${streak}`],
                    ].map(([label, value, note]) => (
                        <div key={label} className="rounded-2xl border border-violet-100 bg-white p-4 text-center shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div>
                            <div className="mt-1 text-2xl font-black text-violet-900">{value}</div>
                            <div className="mt-1 text-[10px] text-slate-400">{note}</div>
                        </div>
                    ))}
                    <div className="col-span-2 lg:col-span-1 rounded-2xl border border-violet-100 bg-white p-4 text-center shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Stars</div>
                        <div className="mt-1 flex items-center justify-center gap-1"><StarIcon className="h-6 w-6 text-amber-500" /><span className="text-2xl font-black text-amber-600">{stars}</span></div>
                        <div className="mt-1 text-[10px] text-slate-400">Session reward</div>
                    </div>
                </div>

                {newBadges.length > 0 && (
                    <div className="border-t border-amber-200 bg-amber-50 px-5 py-4">
                        <div className="text-xs font-black uppercase tracking-wider text-amber-800">🎉 New badges</div>
                        <div className="mt-2 flex flex-wrap gap-2">{newBadges.map(b => <span key={b.id} className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-900">{b.icon} {b.title}</span>)}</div>
                    </div>
                )}

                <div className="border-t border-violet-100 p-4 sm:px-6 flex flex-col md:flex-row md:items-end gap-3">
                    <label className="flex-1 text-xs font-black text-slate-600">Save score as
                        <input value={playerName} onChange={e => setPlayerName(e.target.value)} disabled={scoreSaved} maxLength={24} placeholder="Student name" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-violet-500" />
                    </label>
                    <button onClick={onSaveScore} disabled={!playerName.trim() || scoreSaved} className="rounded-xl bg-[#5c4fd6] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50 cursor-pointer">{scoreSaved ? '✓ Score Saved' : 'Save Score'}</button>
                </div>
            </section>

            <div className="sticky top-2 z-20 mb-5 rounded-2xl border border-violet-200 bg-white/95 p-3 shadow-lg backdrop-blur flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                    {([['all','All'],['review','Needs Review'],['correct','Correct'],['skipped','Skipped']] as [Filter,string][]).map(([value,label]) => (
                        <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-3 py-2 text-xs font-black cursor-pointer ${filter === value ? 'bg-[#5c4fd6] text-white' : 'bg-[#ede9fe] text-violet-800'}`}>{label}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setAll(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black cursor-pointer">Expand All ⌃</button>
                    <button onClick={() => setAll(true)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black cursor-pointer">Collapse All ⌄</button>
                </div>
            </div>

            <div className="space-y-5">
                {visible.map(({ question, index }) => {
                    const a = answers[index];
                    const options = [question.option1, question.option2, question.option3, question.option4].filter(Boolean) as string[];
                    const selectedIndex = a ? options.indexOf(a.selected) : -1;
                    const selectedLetter = selectedIndex >= 0 ? String.fromCharCode(65 + selectedIndex) : '';
                    const isHard = question.difficulty === 'Hard';
                    const number = String(index + 1).padStart(2, '0');
                    const isCollapsed = !!collapsed[index];

                    return (
                        <article key={`${question.game_type}-${index}`} className="overflow-hidden rounded-[26px] border border-violet-200 bg-white shadow-md">
                            <div className="flex items-center justify-between gap-3 bg-[#5c4fd6] px-5 py-2.5 text-white">
                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-100">LQ Champ Section</span>
                                <span className="text-[11px] font-bold text-violet-100">Question {number}/{String(stats.total).padStart(2,'0')}</span>
                            </div>
                            <div className="p-5 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full bg-[#ede9fe] px-3 py-1 text-xs font-black text-[#4f46e5]">{question.text2 || 'Analytical Thinking'}</span>
                                        {question.subtopic && <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{question.subtopic}</span>}
                                    </div>
                                    <span className={`text-xs font-black ${isHard ? 'text-rose-700' : 'text-amber-700'}`}><span className={isHard ? 'text-rose-500' : 'text-amber-500'}>●</span> {question.difficulty || 'Medium'}</span>
                                </div>
                                <div className="mt-4 flex items-start justify-between gap-4">
                                    <div><div className="text-xs font-black uppercase tracking-wider text-violet-500">Question {number}</div><h2 className="mt-1 text-lg sm:text-xl font-black leading-snug">{question.text1}</h2></div>
                                    <button type="button" aria-expanded={!isCollapsed} onClick={() => setCollapsed(p => ({...p,[index]:!isCollapsed}))} className="h-9 w-9 shrink-0 rounded-full border border-violet-200 bg-violet-50 font-black text-violet-700 cursor-pointer">{isCollapsed ? '⌄' : '⌃'}</button>
                                </div>

                                {!isCollapsed && <div className="mt-4">
                                    {question.image_url && <SvgDiagramRenderer url={question.image_url} className="mb-4" showZoomButton />}
                                    <div className="mb-4 flex flex-wrap items-center gap-3 border-y border-slate-100 py-3">
                                        {a ? <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${a.isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>Your Answer: {selectedLetter ? `${selectedLetter}. ` : ''}{a.selected} {a.isCorrect ? '✓' : '✖'}</span> : <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800">Unattempted</span>}
                                        <span className="text-xs font-bold text-slate-500">⏱ Your Time: <span className="text-slate-800">{formatTime(a?.timeSpent)}</span></span>
                                    </div>
                                    <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {options.map((option, oi) => {
                                            const correct = option === question.answer || option === String(question.answer);
                                            const selectedWrong = option === a?.selected && a && !a.isCorrect;
                                            const styles = correct ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold' : selectedWrong ? 'border-rose-400 bg-rose-50 text-rose-950 font-bold' : 'border-slate-200 bg-[#f8f7ff] text-slate-700';
                                            return <div key={oi} className={`min-h-12 rounded-2xl border-2 px-4 py-3 flex items-center justify-between gap-3 text-sm ${styles}`}><span><strong className="mr-2 text-violet-900">{String.fromCharCode(65+oi)}.</strong>{option}</span><span className="font-black">{correct ? '✓' : selectedWrong ? '✕' : ''}</span></div>;
                                        })}
                                    </div>
                                    <div className="rounded-2xl border border-violet-200 bg-[#f7f4ff] p-4 sm:p-5"><div className="mb-1.5 text-xs font-black uppercase tracking-[0.15em] text-violet-900">Solution :</div><p className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-800">{question.explanation || question.know_more || 'Review the clues and compare each option with the rule in the question.'}</p></div>
                                </div>}
                            </div>
                        </article>
                    );
                })}
            </div>

            {visible.length === 0 && <div className="rounded-3xl border border-violet-200 bg-white p-10 text-center font-black text-slate-700">Nothing in this filter.</div>}
            <div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={onRestart} className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3.5 text-sm font-black text-white shadow-xl cursor-pointer">↻ Play Again</button><button onClick={onBack} className="rounded-full bg-slate-800 px-8 py-3.5 text-sm font-black text-white shadow cursor-pointer">Thinksheet Hub</button></div>
        </div>
    );
};

export default SessionReviewSummary;
