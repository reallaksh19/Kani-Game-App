import React, { useMemo } from 'react';
import { KaniAttemptV1 } from '../../integration/kani/contracts';
import {
    CanonicalEvidenceRollup,
    deriveSkillEvidenceRollups,
    deriveTopicEvidenceRollups,
    getPracticeFocusRollups,
    getStrongEvidenceRollups,
} from '../../utils/canonicalEvidenceRollups';

interface CanonicalEvidenceRollupPanelProps {
    attempts: readonly KaniAttemptV1[];
}

const SIGNAL_ORDER: Record<CanonicalEvidenceRollup['revisionSignal'], number> = {
    needs_practice: 0,
    building_evidence: 1,
    strong_recent_evidence: 2,
};

function humanizeId(value: string): string {
    return value
        .replace(/^skill[-_:]/i, '')
        .replace(/^topic[-_:]/i, '')
        .replace(/[-_:]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function signalLabel(signal: CanonicalEvidenceRollup['revisionSignal']): string {
    if (signal === 'needs_practice') return 'Needs practice';
    if (signal === 'strong_recent_evidence') return 'Strong recent evidence';
    return 'Building evidence';
}

function trendLabel(trend: CanonicalEvidenceRollup['trend']): string {
    if (trend === 'improving') return '↑ Improving';
    if (trend === 'declining') return '↓ Declining';
    if (trend === 'steady') return '→ Steady';
    return '· More evidence needed';
}

function formatCredit(value: number | null): string {
    return value === null ? 'Unscored' : `${Math.round(value * 100)}% recent credit`;
}

function sortedRollups(rollups: ReadonlyMap<string, CanonicalEvidenceRollup>): CanonicalEvidenceRollup[] {
    return [...rollups.values()].sort((a, b) => {
        const signalDelta = SIGNAL_ORDER[a.revisionSignal] - SIGNAL_ORDER[b.revisionSignal];
        if (signalDelta !== 0) return signalDelta;
        const creditA = a.recentAverageCredit ?? 1;
        const creditB = b.recentAverageCredit ?? 1;
        if (creditA !== creditB) return creditA - creditB;
        return Date.parse(b.lastAttemptAt || '1970-01-01') - Date.parse(a.lastAttemptAt || '1970-01-01');
    });
}

export const CanonicalEvidenceRollupPanel: React.FC<CanonicalEvidenceRollupPanelProps> = ({ attempts }) => {
    const topicRollups = useMemo(() => deriveTopicEvidenceRollups(attempts), [attempts]);
    const skillRollups = useMemo(() => deriveSkillEvidenceRollups(attempts), [attempts]);
    const practiceFocus = useMemo(() => {
        const skills = getPracticeFocusRollups(skillRollups, 3).map((rollup) => ({ type: 'Skill' as const, rollup }));
        const topics = getPracticeFocusRollups(topicRollups, 3).map((rollup) => ({ type: 'Topic' as const, rollup }));
        return [...skills, ...topics].slice(0, 3);
    }, [skillRollups, topicRollups]);
    const strongEvidence = useMemo(() => {
        const skills = getStrongEvidenceRollups(skillRollups, 3).map((rollup) => ({ type: 'Skill' as const, rollup }));
        const topics = getStrongEvidenceRollups(topicRollups, 3).map((rollup) => ({ type: 'Topic' as const, rollup }));
        return [...skills, ...topics].slice(0, 3);
    }, [skillRollups, topicRollups]);
    const skillRows = useMemo(() => sortedRollups(skillRollups).slice(0, 6), [skillRollups]);
    const topicRows = useMemo(() => sortedRollups(topicRollups).slice(0, 6), [topicRollups]);

    if (topicRollups.size === 0 && skillRollups.size === 0) return null;

    return (
        <div className="mt-5 rounded-3xl border border-violet-300/20 bg-violet-950/15 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">Revision signals</div>
                    <h3 className="mt-1 text-xl font-black text-white">Topic & skill evidence</h3>
                    <p className="mt-1 max-w-3xl text-sm text-gray-400">
                        Recent canonical attempts are grouped into explainable practice signals. Confidence means amount of scored evidence, not mastery confidence.
                    </p>
                </div>
                <div className="rounded-full border border-violet-300/20 bg-slate-950/50 px-3 py-1.5 text-xs font-semibold text-violet-100">
                    {topicRollups.size} topic{topicRollups.size === 1 ? '' : 's'} · {skillRollups.size} skill{skillRollups.size === 1 ? '' : 's'}
                </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SignalSummaryCard title="Practice focus" icon="↻" items={practiceFocus} empty="No current scored evidence is below the practice threshold." />
                <SignalSummaryCard title="Strong recent evidence" icon="✓" items={strongEvidence} empty="Strong evidence appears after a clean minimum sample of scored attempts." />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <RollupList title="Skills" rows={skillRows} empty="No skill-tagged evidence yet." />
                <RollupList title="Topics" rows={topicRows} empty="No topic-tagged evidence yet." />
            </div>
        </div>
    );
};

const SignalSummaryCard: React.FC<{
    title: string;
    icon: string;
    items: Array<{ type: 'Skill' | 'Topic'; rollup: CanonicalEvidenceRollup }>;
    empty: string;
}> = ({ title, icon, items, empty }) => (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/45 p-4">
        <div className="flex items-center gap-2 font-black text-white"><span aria-hidden="true">{icon}</span>{title}</div>
        {items.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">{empty}</p>
        ) : (
            <div className="mt-3 space-y-2">
                {items.map(({ type, rollup }) => (
                    <div key={`${type}_${rollup.id}`} className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-violet-300">{type}</div>
                                <div className="truncate text-sm font-bold text-white" title={rollup.id}>{humanizeId(rollup.id)}</div>
                            </div>
                            <span className="rounded-full border border-slate-600 px-2 py-1 text-[10px] font-bold uppercase text-slate-300">{rollup.confidence} evidence</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">{formatCredit(rollup.recentAverageCredit)} · {rollup.scoredCount} scored · {trendLabel(rollup.trend)}</div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const RollupList: React.FC<{ title: string; rows: CanonicalEvidenceRollup[]; empty: string }> = ({ title, rows, empty }) => (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
        <div className="font-black text-white">{title}</div>
        {rows.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">{empty}</p>
        ) : (
            <div className="mt-3 space-y-2">
                {rows.map((rollup) => (
                    <div key={rollup.id} className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="truncate text-sm font-bold text-white" title={rollup.id}>{humanizeId(rollup.id)}</div>
                                <div className="mt-0.5 text-xs text-gray-500">{rollup.scoredCount} scored / {rollup.attemptCount} total evidence records</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-white">{rollup.recentAverageCredit === null ? '—' : `${Math.round(rollup.recentAverageCredit * 100)}%`}</div>
                                <div className="text-[10px] uppercase text-gray-500">recent credit</div>
                            </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold">
                            <span className="rounded-full border border-slate-600 px-2 py-1 text-slate-300">{signalLabel(rollup.revisionSignal)}</span>
                            <span className="rounded-full border border-slate-600 px-2 py-1 text-slate-300">{trendLabel(rollup.trend)}</span>
                            <span className="rounded-full border border-slate-600 px-2 py-1 text-slate-300">{rollup.confidence} evidence</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);
