import React, { useEffect } from 'react';
import { StarIcon } from './StarIcon';
import { BrainReviewDetails } from './BrainReviewDetails';
import { useAppContext } from '../../contexts/AppContext';
import { BrainReviewItem } from '../../types/brainReview';

interface GameOverScreenProps {
    stars: number;
    streak: number;
    onRestart: () => void;
    onBack: () => void;
    onSaveScore: () => void;
    playerName: string;
    setPlayerName: (name: string) => void;
    scoreSaved: boolean;
    gameTitle?: string;
    skill?: string;
    difficulty?: string;
    correct?: number;
    attempted?: number;
    durationSeconds?: number;
    backLabel?: string;
    reviewItems?: BrainReviewItem[];
}

const formatDuration = (seconds: number) => {
    const safe = Math.max(0, Math.round(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
    stars,
    streak,
    onRestart,
    onBack,
    onSaveScore,
    playerName,
    setPlayerName,
    scoreSaved,
    gameTitle,
    skill,
    difficulty,
    correct,
    attempted,
    durationSeconds,
    backLabel = 'HOME',
    reviewItems = []
}) => {
    const { activeStudent } = useAppContext();
    const hasAccuracy = typeof correct === 'number' && typeof attempted === 'number' && attempted > 0;
    const accuracy = hasAccuracy ? Math.round((correct! / attempted!) * 100) : null;
    const avgSeconds = hasAccuracy && typeof durationSeconds === 'number'
        ? Math.max(1, Math.round(durationSeconds / attempted!))
        : null;

    useEffect(() => {
        if (activeStudent?.name && !playerName.trim()) {
            setPlayerName(activeStudent.name);
        }
    }, [activeStudent?.name, playerName, setPlayerName]);

    const getFeedback = () => {
        if (accuracy !== null) {
            if (accuracy >= 90) return { title: 'Strong Control', icon: '🏆', color: 'text-emerald-300', msg: 'Accurate and consistent reasoning.' };
            if (accuracy >= 70) return { title: 'Building Mastery', icon: '🚀', color: 'text-cyan-300', msg: 'Good control. Review the misses and try to extend the streak.' };
            if (accuracy >= 50) return { title: 'Growing Skill', icon: '💡', color: 'text-yellow-300', msg: 'The core idea is forming. Slow down on the hardest decisions.' };
            return { title: 'Practice Target Found', icon: '🎯', color: 'text-fuchsia-300', msg: 'Use the next run to focus on one rule at a time.' };
        }
        if (stars >= 150) return { title: 'Galaxy Guardian', icon: '🛡️', color: 'text-fuchsia-400', msg: 'Out of this World! 🌟' };
        if (stars >= 100) return { title: 'Space Explorer', icon: '🚀', color: 'text-blue-400', msg: 'Awesome Job! 🚀' };
        if (stars >= 50) return { title: 'Star Catcher', icon: '⭐', color: 'text-yellow-400', msg: 'Great Effort! ✨' };
        return { title: 'Rookie Pilot', icon: '🧑‍🚀', color: 'text-emerald-400', msg: 'Good Try! 🌱' };
    };

    const { title, icon, color, msg } = getFeedback();
    const isBrainReview = Boolean(gameTitle || skill || hasAccuracy || reviewItems.length > 0);

    return (
        <div className={`w-full text-center bg-gray-900/90 rounded-3xl backdrop-blur mx-4 relative z-30 border border-white/10 shadow-2xl animate-scaleIn ${isBrainReview ? 'max-w-2xl p-5 sm:p-7' : 'max-w-sm p-8'}`}>
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-6xl drop-shadow-lg animate-bounce">{icon}</div>
            <div className="mt-7">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">
                    {isBrainReview ? 'Post-Game Review' : 'Session Complete'}
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1 mb-2">
                    {gameTitle || 'Game Over!'}
                </h2>
                {(skill || difficulty) && (
                    <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                        {skill && <span className="rounded-full bg-violet-500/20 border border-violet-400/30 px-3 py-1 text-xs font-bold text-violet-100">{skill}</span>}
                        {difficulty && <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold text-white">● {difficulty}</span>}
                    </div>
                )}
            </div>

            <p className={`text-lg font-bold mb-1 ${color}`}>{title}</p>
            <p className="text-white/80 text-sm mb-5">{msg}</p>

            {isBrainReview ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        <div className="rounded-2xl bg-black/30 border border-yellow-400/20 p-3">
                            <div className="flex items-center justify-center gap-1 text-yellow-300">
                                <StarIcon className="w-5 h-5" />
                                <span className="text-2xl font-black">{stars}</span>
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">Score</div>
                        </div>
                        <div className="rounded-2xl bg-black/30 border border-emerald-400/20 p-3">
                            <div className="text-2xl font-black text-emerald-300">
                                {hasAccuracy ? `${correct}/${attempted}` : '—'}
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">Correct</div>
                        </div>
                        <div className="rounded-2xl bg-black/30 border border-cyan-400/20 p-3">
                            <div className="text-2xl font-black text-cyan-300">
                                {accuracy !== null ? `${accuracy}%` : '—'}
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">Accuracy</div>
                        </div>
                        <div className="rounded-2xl bg-black/30 border border-orange-400/20 p-3">
                            <div className="text-2xl font-black text-orange-300">🔥 {streak}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">Best streak</div>
                        </div>
                    </div>

                    {(typeof durationSeconds === 'number' || avgSeconds !== null) && (
                        <div className="mb-5 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                <div className="font-bold text-white">{typeof durationSeconds === 'number' ? formatDuration(durationSeconds) : '—'}</div>
                                <div className="text-[10px] uppercase tracking-wide text-gray-400">Session time</div>
                            </div>
                            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                                <div className="font-bold text-white">{avgSeconds !== null ? `${avgSeconds}s` : '—'}</div>
                                <div className="text-[10px] uppercase tracking-wide text-gray-400">Avg / attempt</div>
                            </div>
                        </div>
                    )}

                    <BrainReviewDetails items={reviewItems} />

                    {hasAccuracy && (
                        <div className="mb-5 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-left">
                            <div className="text-xs font-black uppercase tracking-wider text-violet-200">Review focus</div>
                            <p className="mt-1 text-sm leading-relaxed text-white/85">
                                {accuracy! >= 80
                                    ? `Keep the same method and aim to make the next ${Math.max(1, attempted!)} attempts with an even longer streak.`
                                    : `Replay once and prioritize accuracy before speed. Your next target is ${Math.min(attempted!, correct! + 2)} correct out of ${attempted!}.`}
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="flex items-center justify-center gap-2 mb-2 bg-black/30 rounded-xl p-4">
                        <StarIcon className="w-8 h-8 text-yellow-400" />
                        <span className="text-4xl font-bold text-yellow-400">{stars}</span>
                    </div>
                    <p className="text-purple-300 mb-6 text-sm">Best Streak: <span className="text-white font-bold">{streak}</span></p>
                </>
            )}

            {!scoreSaved && (
                <div className="mb-5">
                    {activeStudent ? (
                        <div className="mb-2 rounded-xl bg-indigo-500/10 border border-indigo-400/20 px-3 py-2 text-sm text-indigo-100">
                            Save this score to <strong>{activeStudent.avatar} {activeStudent.name}</strong>'s progress.
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-yellow-500 focus:outline-none w-full mb-2"
                            maxLength={20}
                        />
                    )}
                    <button
                        onClick={onSaveScore}
                        disabled={!playerName.trim() && !activeStudent}
                        className="bg-yellow-500 text-gray-950 px-4 py-2.5 rounded-xl font-black hover:bg-yellow-400 disabled:opacity-50 w-full cursor-pointer"
                    >
                        💾 SAVE SCORE
                    </button>
                </div>
            )}
            {scoreSaved && <p className="text-green-300 mb-5 font-bold">✓ Score saved to progress</p>}

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center">
                <button onClick={onBack} className="bg-gray-700 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-600 cursor-pointer">
                    {backLabel}
                </button>
                <button onClick={onRestart} className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform cursor-pointer">
                    PLAY AGAIN
                </button>
            </div>
        </div>
    );
};
