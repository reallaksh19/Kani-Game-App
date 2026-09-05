import React, { useMemo, useState } from 'react';

interface SvgDiagramRendererProps {
    url: string;
    className?: string;
    showZoomButton?: boolean;
}

const normalizeHeading = (heading: string) => heading.toLowerCase().replace(/[\s-]/g, '');

const headingAngles: Record<string, number> = {
    north: -90,
    northeast: -45,
    east: 0,
    southeast: 45,
    south: 90,
    southwest: 135,
    west: 180,
    northwest: -135,
};

const headingLabels: Record<string, string> = {
    north: 'N',
    northeast: 'NE',
    east: 'E',
    southeast: 'SE',
    south: 'S',
    southwest: 'SW',
    west: 'W',
    northwest: 'NW',
};

export const SvgDiagramRenderer: React.FC<SvgDiagramRendererProps> = ({
    url,
    className = '',
    showZoomButton = true,
}) => {
    const [isZoomed, setIsZoomed] = useState(false);

    const protocol = useMemo(() => {
        if (!url.startsWith('svg:')) return null;
        const [, type = '', payload = ''] = url.match(/^svg:([^:]+):?(.*)$/) || [];
        return { type, payload };
    }, [url]);

    if (!url) return null;

    const renderNumberedShapes = (payload: string, isModal: boolean) => {
        const shapePairs = payload.split(',').map(item => {
            const [shape, value] = item.split('=').map(s => s.trim());
            return { shape: shape.toLowerCase(), value: value || '' };
        });

        const shapeSize = isModal ? 120 : 88;
        const strokeWidth = isModal ? 4 : 3;
        const fontSize = isModal ? 40 : 30;

        return (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-2" aria-label="Numbered shapes diagram">
                {shapePairs.map(({ shape, value }, idx) => {
                    const s = shapeSize;
                    const half = s / 2;
                    const pad = 6;
                    const regularPolygon = (sides: number, offsetDeg = -90) => {
                        const r = half - pad;
                        return Array.from({ length: sides }, (_, i) => {
                            const angle = (offsetDeg + (360 / sides) * i) * Math.PI / 180;
                            return `${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`;
                        }).join(' ');
                    };

                    return (
                        <svg
                            key={`${shape}-${idx}`}
                            width={s}
                            height={s}
                            viewBox={`0 0 ${s} ${s}`}
                            className="transition-transform hover:scale-105 select-none"
                            role="img"
                            aria-label={`${shape} with value ${value}`}
                        >
                            {shape === 'square' && <rect x={pad} y={pad} width={s - pad * 2} height={s - pad * 2} fill="#fff" stroke="#111827" strokeWidth={strokeWidth} rx={2} />}
                            {shape === 'rectangle' && <rect x={pad} y={half * 0.45} width={s - pad * 2} height={half * 1.1} fill="#fff" stroke="#111827" strokeWidth={strokeWidth} rx={2} />}
                            {shape === 'circle' && <circle cx={half} cy={half} r={half - pad} fill="#fff" stroke="#111827" strokeWidth={strokeWidth} />}
                            {shape === 'triangle' && <polygon points={`${half},${pad} ${s - pad},${s - pad} ${pad},${s - pad}`} fill="#fff" stroke="#111827" strokeWidth={strokeWidth} strokeLinejoin="round" />}
                            {shape === 'pentagon' && <polygon points={regularPolygon(5)} fill="#fff" stroke="#111827" strokeWidth={strokeWidth} strokeLinejoin="round" />}
                            {shape === 'hexagon' && <polygon points={regularPolygon(6, 0)} fill="#fff" stroke="#111827" strokeWidth={strokeWidth} strokeLinejoin="round" />}
                            {shape === 'octagon' && <polygon points={regularPolygon(8, 22.5)} fill="#fff" stroke="#111827" strokeWidth={strokeWidth} strokeLinejoin="round" />}
                            {shape === 'star' && (() => {
                                const rOuter = half - pad;
                                const rInner = rOuter * 0.45;
                                const points = Array.from({ length: 10 }, (_, i) => {
                                    const r = i % 2 === 0 ? rOuter : rInner;
                                    const angle = (i * 36 - 90) * Math.PI / 180;
                                    return `${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`;
                                }).join(' ');
                                return <polygon points={points} fill="#fff" stroke="#111827" strokeWidth={strokeWidth} strokeLinejoin="round" />;
                            })()}
                            {shape === 'rhombus' && <polygon points={`${half},${pad} ${s - pad},${half} ${half},${s - pad} ${pad},${half}`} fill="#fff" stroke="#111827" strokeWidth={strokeWidth} strokeLinejoin="round" />}
                            <text
                                x={half}
                                y={shape === 'triangle' ? half + 8 : half + 2}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={fontSize}
                                fontWeight="bold"
                                fill="#111827"
                                fontFamily="system-ui, -apple-system, sans-serif"
                            >
                                {value}
                            </text>
                        </svg>
                    );
                })}
            </div>
        );
    };

    const renderCompass = (payload: string, isModal: boolean) => {
        const params = Object.fromEntries(
            payload
                .split(',')
                .filter(Boolean)
                .map(part => {
                    const [key, ...rest] = part.split('=');
                    return [key.trim(), rest.join('=').trim()];
                })
        );
        const requestedHeading = params.heading || 'North';
        const normalized = normalizeHeading(requestedHeading);
        const angle = headingAngles[normalized] ?? headingAngles.north;
        const label = headingLabels[normalized] ?? requestedHeading;
        const size = isModal ? 280 : 180;
        const center = size / 2;
        const radius = center - 26;
        const needleLength = radius * 0.72;
        const radians = angle * Math.PI / 180;
        const endX = center + needleLength * Math.cos(radians);
        const endY = center + needleLength * Math.sin(radians);
        const directions = [
            ['N', -90], ['NE', -45], ['E', 0], ['SE', 45],
            ['S', 90], ['SW', 135], ['W', 180], ['NW', -135],
        ] as const;

        return (
            <div className="flex flex-col items-center justify-center my-2 select-none" aria-label={`Compass facing ${requestedHeading}`}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Compass heading ${requestedHeading}`}>
                    <defs>
                        <marker id="lq-compass-arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L6,3 z" fill="#4f46e5" />
                        </marker>
                    </defs>
                    <circle cx={center} cy={center} r={radius} fill={params.beach === 'true' ? '#fff7ed' : '#f8fafc'} stroke="#6366f1" strokeWidth="2.5" />
                    <circle cx={center} cy={center} r={radius - 9} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                    {directions.map(([dir, dirAngle]) => {
                        const rad = dirAngle * Math.PI / 180;
                        const textRadius = radius + 13;
                        const x = center + textRadius * Math.cos(rad);
                        const y = center + textRadius * Math.sin(rad) + 4;
                        const active = dir === label;
                        return (
                            <text key={dir} x={x} y={y} textAnchor="middle" fontSize={dir.length === 1 ? 13 : 10} fontWeight="900" fill={active ? '#dc2626' : '#64748b'}>
                                {dir}
                            </text>
                        );
                    })}
                    <line
                        x1={center}
                        y1={center}
                        x2={endX}
                        y2={endY}
                        stroke="#4f46e5"
                        strokeWidth={isModal ? 7 : 5}
                        strokeLinecap="round"
                        markerEnd="url(#lq-compass-arrow)"
                    />
                    <circle cx={center} cy={center} r={isModal ? 7 : 5} fill="#1e293b" />
                </svg>
                <span className="text-xs font-semibold text-gray-600 mt-1">Facing {requestedHeading}</span>
            </div>
        );
    };

    const renderSequence = (payload: string, isModal: boolean) => {
        const items = payload.split('|').map(item => item.trim());
        const cellSize = isModal ? 'min-w-[74px] min-h-[74px] text-3xl' : 'min-w-[54px] min-h-[54px] text-xl sm:text-2xl';
        return (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-3" role="img" aria-label="Visual sequence">
                {items.map((item, idx) => {
                    const missing = item === '?';
                    return (
                        <React.Fragment key={`${item}-${idx}`}>
                            <div
                                className={`${cellSize} px-3 rounded-xl border-2 flex items-center justify-center font-black shadow-sm ${
                                    missing
                                        ? 'border-dashed border-indigo-400 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-300 bg-white text-slate-900'
                                }`}
                                aria-label={missing ? `Missing item at position ${idx + 1}` : `Sequence item ${idx + 1}: ${item}`}
                            >
                                {item}
                            </div>
                            {idx < items.length - 1 && <span className="text-slate-300 font-black" aria-hidden="true">→</span>}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    const renderGrid = (payload: string, isModal: boolean) => {
        const rows = payload.split(';').map(row => row.split('|').map(cell => cell.trim()));
        const columns = Math.max(1, ...rows.map(row => row.length));
        const cells = rows.flatMap((row, rowIndex) =>
            Array.from({ length: columns }, (_, colIndex) => ({
                value: row[colIndex] ?? '',
                rowIndex,
                colIndex,
            }))
        );
        const sizeClass = isModal ? 'min-h-[78px] text-3xl' : 'min-h-[54px] sm:min-h-[62px] text-xl sm:text-2xl';

        return (
            <div className="w-full flex justify-center py-3" role="img" aria-label={`${rows.length} by ${columns} visual grid`}>
                <div
                    className="grid gap-1.5 sm:gap-2 w-full"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        maxWidth: `${Math.min(560, columns * (isModal ? 100 : 82))}px`,
                    }}
                >
                    {cells.map(({ value, rowIndex, colIndex }) => {
                        const missing = value === '?';
                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`${sizeClass} rounded-xl border-2 flex items-center justify-center font-black shadow-sm ${
                                    missing
                                        ? 'border-dashed border-indigo-400 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-300 bg-white text-slate-900'
                                }`}
                                aria-label={missing ? `Missing cell row ${rowIndex + 1} column ${colIndex + 1}` : `Row ${rowIndex + 1} column ${colIndex + 1}: ${value}`}
                            >
                                {value}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderHiddenTriangle = (isModal: boolean) => {
        const size = isModal ? 280 : 180;
        return (
            <div className="flex justify-center my-2" role="img" aria-label="Rectangle containing a hidden right triangle">
                <svg width={size} height={size * 0.7} viewBox="0 0 130 90">
                    <rect x="15" y="15" width="100" height="60" fill="#f8fafc" stroke="#1e293b" strokeWidth="3" />
                    <line x1="15" y1="75" x2="115" y2="15" stroke="#4f46e5" strokeWidth="3" />
                </svg>
            </div>
        );
    };

    const renderContent = (isModal = false) => {
        if (protocol?.type === 'shapes-numbered' || protocol?.type === 'shape-numbers') {
            return renderNumberedShapes(protocol.payload, isModal);
        }
        if (protocol?.type === 'compass') {
            return renderCompass(protocol.payload, isModal);
        }
        if (protocol?.type === 'sequence') {
            return renderSequence(protocol.payload, isModal);
        }
        if (protocol?.type === 'grid') {
            return renderGrid(protocol.payload, isModal);
        }
        if (protocol?.type === 'hidden-triangle' || (protocol?.type === 'shapes' && protocol.payload.startsWith('rectangle-diagonal'))) {
            return renderHiddenTriangle(isModal);
        }
        if (protocol) {
            return (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" role="status">
                    Diagram format not supported: {protocol.type}
                </div>
            );
        }

        return (
            <img
                src={url}
                alt="Question diagram"
                className="max-h-56 max-w-full object-contain rounded-xl shadow-sm border border-gray-100"
            />
        );
    };

    const isSvgProtocol = !!protocol;

    return (
        <div className={`relative inline-flex items-center justify-center w-full my-3 ${className}`}>
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 sm:p-5 flex items-center justify-center relative w-full max-w-2xl overflow-x-auto">
                {renderContent(false)}

                {showZoomButton && isSvgProtocol && (
                    <button
                        type="button"
                        onClick={() => setIsZoomed(true)}
                        className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/95 border border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 shadow-sm transition-all text-[10px] font-bold cursor-pointer group"
                        title="Zoom Diagram"
                        aria-label="Zoom diagram"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
                        </svg>
                        <span className="tracking-tighter uppercase text-[9px]">Zoom</span>
                    </button>
                )}
            </div>

            {isZoomed && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setIsZoomed(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Detailed diagram view"
                >
                    <div
                        className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-purple-200 relative animate-scaleIn max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                            <span className="font-bold text-gray-800 text-base flex items-center gap-2">
                                <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="m20 20-3.5-3.5" />
                                </svg>
                                Detailed Diagram View
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsZoomed(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-all cursor-pointer"
                                aria-label="Close zoomed diagram"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 overflow-x-auto">
                            {renderContent(true)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SvgDiagramRenderer;
