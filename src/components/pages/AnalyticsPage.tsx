import React, { useEffect, useMemo, useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { LeaderboardEntry } from '../../types';
import { ALL_GAMES, MATH_GAMES, COMPREHENSION_GAMES } from '../../data/gameDefinitions';
import { useAppContext } from '../../contexts/AppContext';
import { LocalAttemptStore } from '../../integration/kani/AttemptStore';
import { KaniAttemptV1, KaniSourceApp } from '../../integration/kani/contracts';
import {
    canonicalAttemptCredit,
    getCanonicalAttemptSummary,
    getRecentCanonicalAttempts,
} from '../../utils/canonicalAttemptAnalytics';
import { CanonicalEvidenceRollupPanel } from '../shared/CanonicalEvidenceRollupPanel';

interface AnalyticsPageProps {
    onBack: () => void;
    leaderboard: LeaderboardEntry[];
}

const BADGES = [
    { id: 'rookie', title: 'Rookie Pilot', icon: '🧑‍🚀', desc: 'Play your first game', condition: (stats: any) => stats.totalGames >= 1 },
    { id: 'explorer', title: 'Space Explorer', icon: '🚀', desc: 'Play 10 games', condition: (stats: any) => stats.totalGames >= 10 },
    { id: 'veteran', title: 'Galaxy Guardian', icon: '🛡️', desc: 'Play 50 games', condition: (stats: any) => stats.totalGames >= 50 },
    { id: 'star_catcher', title: 'Star Catcher', icon: '⭐', desc: 'Earn 100 stars', condition: (stats: any) => stats.totalStars >= 100 },
    { id: 'supernova', title: 'Supernova', icon: '✨', desc: 'Earn 1000 stars', condition: (stats: any) => stats.totalStars >= 1000 },
    { id: 'bookworm', title: 'Bookworm', icon: '📚', desc: 'Read 5 stories', condition: (stats: any) => stats.storyGames >= 5 },
    { id: 'math_whiz', title: 'Math Whiz', icon: '🧮', desc: 'Play 10 math games', condition: (stats: any) => stats.mathGames >= 10 },
    { id: 'perfect_streak', title: 'Streak Master', icon: '🔥', desc: 'Get a streak of 10', condition: (stats: any) => stats.maxStreak >= 10 },
];

function sourceLabel(sourceApp: KaniSourceApp): string {
    if (sourceApp === 'study-hub') return 'Study-Hub';
    if (sourceApp === 'worksheet-app') return 'Worksheet';
    return 'Kani';
}

function formatEvidenceTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.round(seconds % 60);
    return `${minutes}m ${remainder}s`;
}

function formatEvidenceDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onBack, leaderboard: passedLeaderboard }) => {
    const { activeStudent, leaderboard: contextLeaderboard } = useAppContext();
    const allLeaderboard = passedLeaderboard || contextLeaderboard;
    const attemptStore = useMemo(() => new LocalAttemptStore(), []);
    const [canonicalAttempts, setCanonicalAttempts] = useState<KaniAttemptV1[]>([]);
    const [attemptState, setAttemptState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const activeStudentId = activeStudent?.id || '';

    useEffect(() => {
        let cancelled = false;
        if (!activeStudentId) {
            setCanonicalAttempts([]);
            setAttemptState('idle');
            return () => { cancelled = true; };
        }

        setAttemptState('loading');
        void attemptStore.listAttempts(activeStudentId, { limit: 100 })
            .then((attempts) => {
                if (cancelled) return;
                setCanonicalAttempts(attempts);
                setAttemptState('ready');
            })
            .catch(() => {
                if (cancelled) return;
                setCanonicalAttempts([]);
                setAttemptState('error');
            });

        return () => { cancelled = true; };
    }, [activeStudentId, attemptStore]);

    const studentLeaderboard = useMemo(() => {
        if (!activeStudent) return allLeaderboard;
        return allLeaderboard.filter(e => e.name.toLowerCase() === activeStudent.name.toLowerCase());
    }, [allLeaderboard, activeStudent]);

    const canonicalSummary = useMemo(() => getCanonicalAttemptSummary(canonicalAttempts), [canonicalAttempts]);
    const recentCanonicalAttempts = useMemo(() => getRecentCanonicalAttempts(canonicalAttempts, 8), [canonicalAttempts]);

    const stats = useMemo(() => {
        const totalGames = studentLeaderboard.length;
        const totalStars = studentLeaderboard.reduce((sum, e) => sum + e.stars, 0);
        const totalHints = studentLeaderboard.reduce((sum, e) => sum + (e.hintsUsed || 0), 0);
        const maxStreak = Math.max(...studentLeaderboard.map(e => e.streak), 0);
        const playerName = activeStudent ? activeStudent.name : (studentLeaderboard[studentLeaderboard.length - 1]?.name || 'Cadet');
        const playerAvatar = activeStudent ? activeStudent.avatar : '🧑‍🚀';
        const playerGrade = activeStudent?.grade || 'Cadet';

        // Category counts
        const storyGames = studentLeaderboard.filter(e => COMPREHENSION_GAMES.some(g => g.id === e.game)).length;
        const mathGames = studentLeaderboard.filter(e => MATH_GAMES.some(g => g.id === e.game)).length;

        // Daily stars (last 7 days)
        const today = new Date();
        const dailyStars = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const stars = studentLeaderboard
                .filter(e => e.date.startsWith(dateStr))
                .reduce((sum, e) => sum + e.stars, 0);
            return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), stars };
        });

        // Game performance
        const gameStats: Record<string, { count: number, stars: number }> = {};
        studentLeaderboard.forEach(e => {
            if (!gameStats[e.game]) gameStats[e.game] = { count: 0, stars: 0 };
            gameStats[e.game].count++;
            gameStats[e.game].stars += e.stars;
        });

        const topGames = Object.entries(gameStats)
            .map(([id, s]) => ({ id, ...s, avg: Math.round(s.stars / s.count) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalGames, totalStars, totalHints, maxStreak, playerName, playerAvatar, playerGrade,
            storyGames, mathGames, dailyStars, topGames
        };
    }, [studentLeaderboard, activeStudent]);

    return (
        <SpaceBackground>
            <div className="flex flex-col h-full pt-6 px-4 pb-8 overflow-y-auto w-full max-w-6xl mx-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onBack} aria-label="Go Back" className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 text-2xl transition-colors cursor-pointer">←</button>
                    <div className="flex items-center gap-3">
                        <div className="text-4xl w-14 h-14 rounded-2xl bg-indigo-900/60 border border-indigo-400/40 flex items-center justify-center shadow-lg">
                            {stats.playerAvatar}
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white">My Mission Control</h1>
                            <p className="text-gray-300">
                                Welcome back, <span className="text-yellow-400 font-bold">{stats.playerName}</span>!
                                <span className="ml-2 text-xs bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-medium">{stats.playerGrade}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-blue-500/30 backdrop-blur">
                        <div className="text-3xl mb-2">⭐</div>
                        <div className="text-white text-3xl font-bold">{stats.totalStars}</div>
                        <div className="text-blue-300 text-sm font-bold uppercase">Total Stars</div>
                    </div>
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-green-500/30 backdrop-blur">
                        <div className="text-3xl mb-2">🎮</div>
                        <div className="text-white text-3xl font-bold">{stats.totalGames}</div>
                        <div className="text-green-300 text-sm font-bold uppercase">Games Played</div>
                    </div>
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-orange-500/30 backdrop-blur">
                        <div className="text-3xl mb-2">🔥</div>
                        <div className="text-white text-3xl font-bold">{stats.maxStreak}</div>
                        <div className="text-orange-300 text-sm font-bold uppercase">Best Streak</div>
                    </div>
                    <div className="bg-gray-800/80 p-6 rounded-2xl border border-purple-500/30 backdrop-blur">
                        <div className="text-3xl mb-2">💡</div>
                        <div className="text-white text-3xl font-bold">{stats.totalHints}</div>
                        <div className="text-purple-300 text-sm font-bold uppercase">Hints Used</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Activity Chart */}
                    <div className="bg-gray-900/60 p-6 rounded-3xl border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-6">Weekly Stars</h2>
                        <div className="flex items-end justify-between h-48 gap-2">
                            {stats.dailyStars.map((d, i) => {
                                const max = Math.max(...stats.dailyStars.map(s => s.stars), 10);
                                const height = Math.max((d.stars / max) * 100, 5);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group">
                                        <div className="text-white text-xs mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{d.stars}</div>
                                        <div
                                            className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg transition-all hover:brightness-110"
                                            style={{ height: `${height}%` }}
                                        />
                                        <div className="text-gray-400 text-xs mt-2 font-bold">{d.day}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="bg-gray-900/60 p-6 rounded-3xl border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-6">Mission Badges</h2>
                        <div className="grid grid-cols-4 gap-4">
                            {BADGES.map(badge => {
                                const isUnlocked = badge.condition(stats);
                                return (
                                    <div key={badge.id} className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center border-2 transition-all ${isUnlocked ? 'bg-indigo-900/50 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800/30 border-gray-700 text-gray-600 grayscale'}`}>
                                        <div className="text-3xl mb-1">{badge.icon}</div>
                                        <div className="text-[10px] font-bold leading-tight">{badge.title}</div>
                                        {!isUnlocked && <div className="text-[8px] mt-1">Locked</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Canonical cross-app evidence */}
                <section className="bg-gray-900/60 p-6 rounded-3xl border border-cyan-400/20 mb-8">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Kani attempt v1</div>
                            <h2 className="text-2xl font-bold text-white">Canonical Learning Evidence</h2>
                            <p className="mt-1 text-sm text-gray-400">Study-Hub, Worksheet and external activity evidence keyed to the active student ID. Average credit is evidence, not a calibrated mastery score.</p>
                        </div>
                        {canonicalSummary.latestCompletedAt && (
                            <div className="rounded-full border border-cyan-400/20 bg-cyan-950/30 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                                Latest {formatEvidenceDate(canonicalSummary.latestCompletedAt)}
                            </div>
                        )}
                    </div>

                    {attemptState === 'loading' ? (
                        <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-5 text-center text-gray-300">Loading canonical evidence…</div>
                    ) : attemptState === 'error' ? (
                        <div className="rounded-2xl border border-rose-400/30 bg-rose-950/30 p-4 text-rose-200">Canonical attempt history could not be read from this device.</div>
                    ) : canonicalAttempts.length === 0 ? (
                        <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-5 text-center text-gray-400">No canonical Learn, Practice or external-activity evidence has been saved for this student yet.</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                <EvidenceMetric label="Evidence records" value={String(canonicalSummary.records)} />
                                <EvidenceMetric label="Activities" value={String(canonicalSummary.activities)} />
                                <EvidenceMetric label="Average credit" value={canonicalSummary.averageCredit == null ? '—' : `${Math.round(canonicalSummary.averageCredit * 100)}%`} />
                                <EvidenceMetric label="Response time" value={formatEvidenceTime(canonicalSummary.totalResponseTimeMs)} />
                            </div>

                            <div className="mb-5 flex flex-wrap gap-2 text-xs">
                                {canonicalSummary.sources.map((source) => (
                                    <span key={source.sourceApp} className="rounded-full border border-gray-600 bg-gray-800/70 px-3 py-1.5 text-gray-200">
                                        {sourceLabel(source.sourceApp)} · {source.count}
                                    </span>
                                ))}
                                <span className="rounded-full border border-gray-600 bg-gray-800/70 px-3 py-1.5 text-gray-300">Scored evidence · {canonicalSummary.scoredRecords}</span>
                                <span className="rounded-full border border-gray-600 bg-gray-800/70 px-3 py-1.5 text-gray-300">Fully correct records · {canonicalSummary.correctRecords}</span>
                            </div>

                            <CanonicalEvidenceRollupPanel attempts={canonicalAttempts} />

                            <div className="mt-5 space-y-2">
                                {recentCanonicalAttempts.map((attempt) => {
                                    const credit = canonicalAttemptCredit(attempt);
                                    return (
                                        <div key={attempt.attemptId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-700 bg-gray-800/40 p-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-cyan-950/50 px-2.5 py-1 text-[11px] font-bold text-cyan-200">{sourceLabel(attempt.sourceApp)}</span>
                                                    <span className="text-sm font-bold text-white break-all">{attempt.activityId}</span>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-400">
                                                    {attempt.questionId ? `Question ${attempt.questionId}` : attempt.pageId ? `Page ${attempt.pageId}` : attempt.topicId ? `Topic ${attempt.topicId}` : attempt.activityType}
                                                    {' · '}{attempt.difficulty}{' · '}{formatEvidenceDate(attempt.completedAt)}
                                                </div>
                                            </div>
                                            <div className="text-right text-sm">
                                                <div className="font-bold text-white">{credit == null ? (typeof attempt.score === 'number' ? `Score ${attempt.score}` : 'Recorded') : `${Math.round(credit * 100)}% credit`}</div>
                                                {typeof attempt.responseTimeMs === 'number' && <div className="text-xs text-gray-400">{formatEvidenceTime(attempt.responseTimeMs)}</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                {/* Top Games List */}
                <div className="bg-gray-900/60 p-6 rounded-3xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-6">Favorite Missions</h2>
                    <div className="space-y-3">
                        {stats.topGames.map((g, i) => {
                            const info = ALL_GAMES.find(def => def.id === g.id);
                            return (
                                <div key={i} className="flex items-center gap-4 bg-gray-800/40 p-4 rounded-xl hover:bg-gray-800/60 transition-colors">
                                    <div className="text-2xl">{info?.icon || '🎮'}</div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold">{info?.title || g.id}</div>
                                        <div className="text-gray-400 text-xs">{g.count} plays</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-yellow-400 font-bold">{g.avg} avg stars</div>
                                    </div>
                                </div>
                            );
                        })}
                        {stats.topGames.length === 0 && <p className="text-gray-500 text-center">No games played yet!</p>}
                    </div>
                </div>

            </div>
        </SpaceBackground>
    );
};

const EvidenceMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-2xl border border-cyan-400/15 bg-gray-800/55 p-4">
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-cyan-300">{label}</div>
    </div>
);