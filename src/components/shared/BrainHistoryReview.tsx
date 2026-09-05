import React from 'react';
import { BrainSessionRecord } from '../../types/brainProgress';
import { BrainReviewDetails } from './BrainReviewDetails';

interface BrainHistoryReviewProps {
    session: BrainSessionRecord;
    onClose: () => void;
}

const formatDuration = (seconds: number) => {
    const safe = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(safe / 60);
    const remainder = safe % 60;
    return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

export const BrainHistoryReview: React.FC<BrainHistoryReviewProps> = ({ session, onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${session.gameTitle} saved review`}>
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-950 p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Saved Brain Review</div>
                    <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">{session.gameTitle}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-violet-500/20 px-3 py-1 text-violet-100">{session.skill}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-white">{session.difficulty}</span>
                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{new Date(session.completedAt).toLocaleString()}</span>
                    </div>
                </div>
                <button onClick={onClose} aria-label="Close saved review" className="rounded-full bg-white/10 px-3 py-2 font-black text-white hover:bg-white/20">✕</button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Metric label="Mastery" value={`${session.masteryScore}%`} />
                <Metric label="Accuracy" value={`${session.accuracy}%`} />
                <Metric label="Correct" value={`${session.correct}/${session.attempted}`} />
                <Metric label="Time" value={formatDuration(session.durationSeconds)} />
                <Metric label="Avg / try" value={`${session.averageSeconds}s`} />
            </div>

            {session.reviewItems?.length ? <BrainReviewDetails items={session.reviewItems} /> : null}

            {session.questionReview?.length ? (
                <div className="space-y-3 text-left">
                    <div className="text-xs font-black uppercase tracking-wider text-violet-200">Saved question evidence</div>
                    {session.questionReview.map(item => (
                        <details key={`${session.id}-${item.round}`} open={!item.correct} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <summary className="cursor-pointer list-none font-bold text-white">
                                <span className={item.correct ? 'text-emerald-300' : 'text-rose-300'}>{item.correct ? '✓' : '✗'}</span>{' '}
                                Question {item.round}: {item.prompt}
                            </summary>
                            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                <div className="rounded-xl bg-black/20 p-3 text-white/85"><span className="font-black text-white">Your answer:</span> {item.selected}</div>
                                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-100"><span className="font-black">Correct answer:</span> {item.answer}</div>
                            </div>
                            {item.explanation && <div className="mt-2 rounded-xl bg-violet-500/10 p-3 text-sm leading-relaxed text-violet-100">{item.explanation}</div>}
                        </details>
                    ))}
                </div>
            ) : null}

            {!session.reviewItems?.length && !session.questionReview?.length && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                    This older saved session has mastery metrics but no retained round-by-round evidence.
                </div>
            )}
        </div>
    </div>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
        <div className="text-xl font-black text-white">{value}</div>
        <div className="mt-1 text-[10px] uppercase tracking-wide text-white/50">{label}</div>
    </div>
);

export default BrainHistoryReview;
