import React, { useEffect, useState } from 'react';
import { BrainReviewItem, MemoryReviewItem, MirrorReviewItem, PathReviewItem, VennReviewItem } from '../../types/brainReview';

const statusClass = (correct: boolean) => correct
    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
    : 'border-rose-400/30 bg-rose-500/10 text-rose-200';

const MiniGrid: React.FC<{
    size: number;
    active: number[];
    selected?: number[];
    mode?: 'target' | 'selected';
}> = ({ size, active, selected = [], mode = 'target' }) => (
    <div
        className="grid gap-1 rounded-xl border border-white/10 bg-slate-950/70 p-2"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, width: Math.min(168, size * 34 + 16) }}
    >
        {Array.from({ length: size * size }, (_, index) => {
            const isActive = active.includes(index);
            const isSelected = selected.includes(index);
            let cellClass = 'border-white/10 bg-slate-800';
            if (mode === 'target' && isActive) cellClass = 'border-pink-300 bg-pink-400';
            if (mode === 'selected' && isSelected && isActive) cellClass = 'border-emerald-300 bg-emerald-500';
            if (mode === 'selected' && isSelected && !isActive) cellClass = 'border-rose-300 bg-rose-500';
            if (mode === 'selected' && !isSelected && isActive) cellClass = 'border-amber-300 bg-amber-500/50';
            return <div key={index} className={`aspect-square rounded border ${cellClass}`} />;
        })}
    </div>
);

const MemoryDetail: React.FC<{ item: MemoryReviewItem }> = ({ item }) => {
    const [replaying, setReplaying] = useState(false);

    useEffect(() => {
        if (!replaying) return;
        const id = window.setTimeout(() => setReplaying(false), 1600);
        return () => window.clearTimeout(id);
    }, [replaying]);

    return (
        <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col items-center">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">Target pattern</div>
                    <MiniGrid size={item.gridSize} active={replaying || !item.correct ? item.targetCells : []} />
                </div>
                <div className="flex flex-col items-center">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">Your recall</div>
                    <MiniGrid size={item.gridSize} active={item.targetCells} selected={item.selectedCells} mode="selected" />
                </div>
            </div>
            <button
                type="button"
                onClick={() => setReplaying(true)}
                className="mt-3 rounded-lg border border-pink-400/30 bg-pink-500/15 px-3 py-2 text-xs font-black text-pink-100 hover:bg-pink-500/25"
            >
                ▶ Replay target for 1.6s
            </button>
            <p className="mt-2 text-xs text-white/70">
                Amber cells were missed. Red cells were selected but were not in the target.
            </p>
        </div>
    );
};

const PatternGrid: React.FC<{ pattern: number[]; size: number }> = ({ pattern, size }) => (
    <div className="grid gap-1 rounded-lg bg-slate-950 p-2" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, width: Math.min(150, size * 31 + 16) }}>
        {pattern.map((cell, index) => <div key={index} className={`aspect-square rounded ${cell ? 'bg-teal-300' : 'bg-slate-700'}`} />)}
    </div>
);

const MirrorDetail: React.FC<{ item: MirrorReviewItem }> = ({ item }) => (
    <div>
        <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="text-center">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">Source</div>
                <PatternGrid pattern={item.pattern} size={item.size} />
            </div>
            <div className="text-center">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-teal-200">Mirror axis</div>
                <div className={`mx-auto bg-teal-300/80 ${item.axis === 'vertical' ? 'h-24 w-1' : 'h-1 w-24'}`} />
                <div className="mt-1 text-xs font-bold text-teal-100">{item.axis}</div>
            </div>
            <div className="text-center">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">Correct reflection</div>
                <PatternGrid pattern={item.correctPattern} size={item.size} />
            </div>
        </div>
        {!item.correct && (
            <div className="mt-3 text-center">
                <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-rose-300">Your choice</div>
                <div className="inline-block rounded-xl border border-rose-400/30 p-1"><PatternGrid pattern={item.selectedPattern} size={item.size} /></div>
            </div>
        )}
        <p className="mt-2 text-xs text-white/70">Reflect every filled cell across the shown axis while keeping its distance from the axis unchanged.</p>
    </div>
);

const PathBoard: React.FC<{ item: PathReviewItem }> = ({ item }) => {
    const obstacles = new Set(item.obstacles);
    const stars = new Set(item.stars);
    const user = new Set(item.userPath);
    const optimal = new Set(item.optimalPath);
    return (
        <div className="mx-auto grid gap-1 rounded-xl border border-white/10 bg-slate-950/70 p-2" style={{ gridTemplateColumns: `repeat(${item.size}, minmax(0, 1fr))`, width: Math.min(300, item.size * 42 + 16) }}>
            {Array.from({ length: item.size * item.size }, (_, index) => {
                const x = index % item.size;
                const y = Math.floor(index / item.size);
                const key = `${x},${y}`;
                const both = user.has(key) && optimal.has(key);
                const cellClass = obstacles.has(key)
                    ? 'border-slate-500 bg-slate-700'
                    : both
                        ? 'border-violet-300 bg-violet-500/45'
                        : optimal.has(key)
                            ? 'border-emerald-300 bg-emerald-500/35'
                            : user.has(key)
                                ? 'border-cyan-300 bg-cyan-500/35'
                                : 'border-white/10 bg-white/5';
                const glyph = key === item.start ? '🤖' : key === item.goal ? '🏁' : obstacles.has(key) ? '🪨' : stars.has(key) ? '⭐' : '';
                return <div key={key} className={`flex aspect-square items-center justify-center rounded-lg border text-sm ${cellClass}`}>{glyph}</div>;
            })}
        </div>
    );
};

const PathDetail: React.FC<{ item: PathReviewItem }> = ({ item }) => (
    <div>
        <PathBoard item={item} />
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] font-bold">
            <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-cyan-100">Your route: {item.moveCount} moves</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-100">Optimal: {item.optimalMoves} moves</span>
        </div>
        <p className="mt-2 text-xs text-white/70">Cyan = your route, green = shortest route, violet = overlap. Compare where your route first diverged.</p>
    </div>
);

const zoneLabel = (zone: VennReviewItem['correctZone'], item: VennReviewItem) => {
    if (zone === 'A') return `${item.setA} only`;
    if (zone === 'B') return `${item.setB} only`;
    if (zone === 'Both') return 'Both sets';
    return 'Neither set';
};

const VennDetail: React.FC<{ item: VennReviewItem }> = ({ item }) => {
    const inA = item.traits.includes(item.setA);
    const inB = item.traits.includes(item.setB);
    return (
        <div>
            <div className="mb-3 text-center text-4xl">{item.itemEmoji}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`rounded-xl border p-3 ${inA ? 'border-rose-300/40 bg-rose-500/15' : 'border-white/10 bg-white/5'}`}>
                    <div className="font-black text-white">Set A: {item.setA}</div>
                    <div className="mt-1 text-white/70">{inA ? '✓ Item has this trait' : '✕ Item does not have this trait'}</div>
                </div>
                <div className={`rounded-xl border p-3 ${inB ? 'border-blue-300/40 bg-blue-500/15' : 'border-white/10 bg-white/5'}`}>
                    <div className="font-black text-white">Set B: {item.setB}</div>
                    <div className="mt-1 text-white/70">{inB ? '✓ Item has this trait' : '✕ Item does not have this trait'}</div>
                </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/80">
                <strong>{item.itemLabel}</strong> has traits: {item.traits.join(', ')}. Therefore it belongs in <strong className="text-emerald-200">{zoneLabel(item.correctZone, item)}</strong>.
                {!item.correct && <> You selected <strong className="text-rose-200">{zoneLabel(item.selectedZone, item)}</strong>.</>}
            </p>
        </div>
    );
};

const ReviewBody: React.FC<{ item: BrainReviewItem }> = ({ item }) => {
    if (item.kind === 'memory') return <MemoryDetail item={item} />;
    if (item.kind === 'sequence') {
        const mismatch = item.target.findIndex((value, index) => item.selected[index] !== value);
        return (
            <div>
                <div className="space-y-2">
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Target</span><div className="mt-1 flex flex-wrap gap-1">{item.target.map((value, index) => <span key={`${value}-${index}`} className="rounded-lg bg-emerald-500/15 px-2 py-1 text-lg">{value}</span>)}</div></div>
                    <div><span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Your sequence</span><div className="mt-1 flex flex-wrap gap-1">{item.selected.map((value, index) => <span key={`${value}-${index}`} className={`rounded-lg px-2 py-1 text-lg ${item.target[index] === value ? 'bg-emerald-500/15' : 'bg-rose-500/25 ring-1 ring-rose-300/50'}`}>{value}</span>)}</div></div>
                </div>
                <p className="mt-2 text-xs text-white/70">{item.correct ? 'Exact sequence recalled.' : `First mismatch: position ${Math.max(1, mismatch + 1)}. Rehearse the sequence in small chunks.`}</p>
            </div>
        );
    }
    if (item.kind === 'path') return <PathDetail item={item} />;
    if (item.kind === 'data') {
        return (
            <div>
                <div className="mb-2 flex flex-wrap gap-1">{item.points.map(point => <span key={point.label} className="rounded-lg bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100">{point.label}: <strong>{point.value}</strong></span>)}</div>
                <p className="text-sm font-bold text-white">{item.question}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><div className={`rounded-lg border p-2 ${item.correct ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-rose-400/30 bg-rose-500/10'}`}>Your answer: <strong>{item.selected}</strong></div><div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2">Correct: <strong>{item.answer}</strong></div></div>
                <p className="mt-2 text-xs text-white/70">Read the exact values first, then perform only the comparison, total, or difference asked for.</p>
            </div>
        );
    }
    if (item.kind === 'venn') return <VennDetail item={item} />;
    if (item.kind === 'mirror') return <MirrorDetail item={item} />;
    return (
        <div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-lg font-black text-white">{item.leftItems.map((value, index) => <React.Fragment key={`${value}-${index}`}><span className="rounded-full bg-amber-500/20 px-3 py-2">{value}</span>{index < item.leftItems.length - 1 && <span>+</span>}</React.Fragment>)}<span>=</span><span className="rounded-full bg-emerald-500/20 px-3 py-2 text-emerald-200">{item.answer}</span></div>
            <p className="mt-3 text-xs text-white/75">Add the visible weights: {item.leftItems.join(' + ')} = <strong>{item.answer}</strong>. {item.correct ? 'Your balancing weight matched the total.' : <>You chose <strong className="text-rose-200">{item.selected}</strong>, so the scale would not balance.</>}</p>
        </div>
    );
};

export const BrainReviewDetails: React.FC<{ items: BrainReviewItem[] }> = ({ items }) => {
    if (items.length === 0) return null;
    const visible = [...items]
        .sort((a, b) => Number(a.correct) - Number(b.correct) || b.round - a.round)
        .slice(0, 6);
    const misses = items.filter(item => !item.correct).length;

    return (
        <section className="mb-5 text-left">
            <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                    <div className="text-xs font-black uppercase tracking-wider text-violet-200">Round review</div>
                    <div className="text-[11px] text-white/55">Game-specific evidence · misses first · up to 6 rounds</div>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-white">{misses} miss{misses === 1 ? '' : 'es'}</span>
            </div>
            <div className="space-y-2">
                {visible.map(item => (
                    <details key={item.id} open={!item.correct} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                            <div className="flex items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(item.correct)}`}>{item.correct ? '✓ Correct' : '✕ Review'}</span><span className="text-sm font-black text-white">Round {item.round}</span></div>
                            <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-white/50">{item.difficulty}</span><span className="text-white/50 transition group-open:rotate-180">⌄</span></div>
                        </summary>
                        <div className="mt-3 border-t border-white/10 pt-3"><ReviewBody item={item} /></div>
                    </details>
                ))}
            </div>
        </section>
    );
};
