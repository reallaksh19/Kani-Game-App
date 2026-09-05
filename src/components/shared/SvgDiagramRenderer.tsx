import React, { useState } from 'react';

interface SvgDiagramRendererProps {
    url: string;
    className?: string;
    showZoomButton?: boolean;
}

export const SvgDiagramRenderer: React.FC<SvgDiagramRendererProps> = ({
    url,
    className = '',
    showZoomButton = true,
}) => {
    const [isZoomed, setIsZoomed] = useState(false);

    if (!url) return null;

    // Renders the specific diagram based on protocol
    const renderContent = (isModal = false) => {
        // Protocol: svg:shapes-numbered:square=4,pentagon=0,triangle=5,hexagon=6,circle=3
        if (url.startsWith('svg:shapes-numbered:') || url.startsWith('svg:shape-numbers:')) {
            const raw = url.replace(/^(svg:shapes-numbered:|svg:shape-numbers:)/, '');
            const shapePairs = raw.split(',').map(item => {
                const [shape, val] = item.split('=').map(s => s.trim());
                return { shape: shape.toLowerCase(), value: val || '' };
            });

            const shapeSize = isModal ? 120 : 88;
            const strokeWidth = isModal ? 4 : 3;
            const fontSize = isModal ? 40 : 30;

            return (
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-2">
                    {shapePairs.map(({ shape, value }, idx) => {
                        const s = shapeSize;
                        const half = s / 2;
                        const pad = 6;

                        return (
                            <div key={idx} className="flex flex-col items-center">
                                <svg
                                    width={s}
                                    height={s}
                                    viewBox={`0 0 ${s} ${s}`}
                                    className="transition-transform hover:scale-105 select-none"
                                >
                                    {/* Shape Path */}
                                    {shape === 'square' && (
                                        <rect
                                            x={pad}
                                            y={pad}
                                            width={s - pad * 2}
                                            height={s - pad * 2}
                                            fill="#ffffff"
                                            stroke="#111827"
                                            strokeWidth={strokeWidth}
                                            rx={2}
                                        />
                                    )}

                                    {shape === 'circle' && (
                                        <circle
                                            cx={half}
                                            cy={half}
                                            r={half - pad}
                                            fill="#ffffff"
                                            stroke="#111827"
                                            strokeWidth={strokeWidth}
                                        />
                                    )}

                                    {shape === 'triangle' && (
                                        <polygon
                                            points={`${half},${pad} ${s - pad},${s - pad} ${pad},${s - pad}`}
                                            fill="#ffffff"
                                            stroke="#111827"
                                            strokeWidth={strokeWidth}
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {shape === 'pentagon' && (() => {
                                        // Regular pentagon with apex on top and flat horizontal base
                                        const r = half - pad;
                                        const pts = [];
                                        for (let i = 0; i < 5; i++) {
                                            const angle = (i * 72 - 90) * (Math.PI / 180);
                                            pts.push(`${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`);
                                        }
                                        return (
                                            <polygon
                                                points={pts.join(' ')}
                                                fill="#ffffff"
                                                stroke="#111827"
                                                strokeWidth={strokeWidth}
                                                strokeLinejoin="round"
                                            />
                                        );
                                    })()}

                                    {shape === 'hexagon' && (() => {
                                        // Hexagon with flat top and flat bottom, pointed left & right (matches LogIQids screenshot)
                                        const w = s - pad * 2;
                                        const left = pad;
                                        const top = pad;
                                        const right = s - pad;
                                        const bottom = s - pad;
                                        const quarterW = w / 4;

                                        const pts = [
                                            `${left + quarterW},${top}`,
                                            `${right - quarterW},${top}`,
                                            `${right},${half}`,
                                            `${right - quarterW},${bottom}`,
                                            `${left + quarterW},${bottom}`,
                                            `${left},${half}`,
                                        ];
                                        return (
                                            <polygon
                                                points={pts.join(' ')}
                                                fill="#ffffff"
                                                stroke="#111827"
                                                strokeWidth={strokeWidth}
                                                strokeLinejoin="round"
                                            />
                                        );
                                    })()}

                                    {shape === 'star' && (() => {
                                        const rOuter = half - pad;
                                        const rInner = rOuter * 0.45;
                                        const pts = [];
                                        for (let i = 0; i < 10; i++) {
                                            const r = i % 2 === 0 ? rOuter : rInner;
                                            const angle = (i * 36 - 90) * (Math.PI / 180);
                                            pts.push(`${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`);
                                        }
                                        return (
                                            <polygon
                                                points={pts.join(' ')}
                                                fill="#ffffff"
                                                stroke="#111827"
                                                strokeWidth={strokeWidth}
                                                strokeLinejoin="round"
                                            />
                                        );
                                    })()}

                                    {shape === 'rhombus' && (
                                        <polygon
                                            points={`${half},${pad} ${s - pad},${half} ${half},${s - pad} ${pad},${half}`}
                                            fill="#ffffff"
                                            stroke="#111827"
                                            strokeWidth={strokeWidth}
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {/* Number in center */}
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
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Protocol: svg:compass:heading=North,beach=true
        if (url.startsWith('svg:compass')) {
            const size = isModal ? 220 : 150;
            const center = size / 2;
            const radius = center - 18;

            return (
                <div className="flex flex-col items-center justify-center my-2 select-none">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        {/* Outer Ring */}
                        <circle cx={center} cy={center} r={radius} fill="#f8fafc" stroke="#6366f1" strokeWidth="2.5" />
                        <circle cx={center} cy={center} r={radius - 8} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />

                        {/* Cardinal Directions */}
                        <text x={center} y={16} textAnchor="middle" fontSize="13" fontWeight="900" fill="#dc2626">N</text>
                        <text x={size - 10} y={center + 5} textAnchor="middle" fontSize="13" fontWeight="900" fill="#475569">E</text>
                        <text x={center} y={size - 6} textAnchor="middle" fontSize="13" fontWeight="900" fill="#475569">S</text>
                        <text x={10} y={center + 5} textAnchor="middle" fontSize="13" fontWeight="900" fill="#475569">W</text>

                        {/* Compass Pointer (North-South Needle) */}
                        <polygon
                            points={`${center},${center - radius + 12} ${center + 7},${center} ${center - 7},${center}`}
                            fill="#ef4444"
                        />
                        <polygon
                            points={`${center},${center + radius - 12} ${center + 7},${center} ${center - 7},${center}`}
                            fill="#94a3b8"
                        />
                        <circle cx={center} cy={center} r="4" fill="#1e293b" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-500 mt-1">Compass Direction</span>
                </div>
            );
        }

        // Protocol: svg:hidden-triangle
        if (url.startsWith('svg:hidden-triangle') || url.startsWith('svg:shapes:rectangle-diagonal')) {
            const size = isModal ? 200 : 130;
            return (
                <div className="flex justify-center my-2">
                    <svg width={size} height={size * 0.7} viewBox="0 0 130 90">
                        <rect x="15" y="15" width="100" height="60" fill="#f1f5f9" stroke="#1e293b" strokeWidth="3" />
                        <line x1="15" y1="75" x2="115" y2="15" stroke="#3b82f6" strokeWidth="3" />
                    </svg>
                </div>
            );
        }

        // Standard image or unknown SVG string
        return (
            <img
                src={url}
                alt="Diagram"
                className="max-h-56 object-contain rounded-xl shadow-sm border border-gray-100"
            />
        );
    };

    const isSvgProtocol = url.startsWith('svg:');

    return (
        <div className={`relative inline-flex items-center justify-center w-full my-3 ${className}`}>
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 sm:p-5 flex items-center justify-center relative w-full max-w-2xl">
                {renderContent(false)}

                {/* Zoom Button (as shown in LogIQids UI) */}
                {showZoomButton && isSvgProtocol && (
                    <button
                        type="button"
                        onClick={() => setIsZoomed(true)}
                        className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/90 border border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 shadow-sm transition-all text-[10px] font-bold cursor-pointer group"
                        title="Zoom Diagram"
                    >
                        <span className="text-base group-hover:scale-110 transition-transform">🔍</span>
                        <span className="tracking-tighter uppercase text-[9px]">Zoom</span>
                    </button>
                )}
            </div>

            {/* Enlarged Zoom Modal */}
            {isZoomed && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setIsZoomed(false)}
                >
                    <div
                        className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-purple-200 relative animate-scaleIn"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                            <span className="font-bold text-gray-800 text-base">🔍 Detailed Diagram View</span>
                            <button
                                type="button"
                                onClick={() => setIsZoomed(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-all cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            {renderContent(true)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SvgDiagramRenderer;
