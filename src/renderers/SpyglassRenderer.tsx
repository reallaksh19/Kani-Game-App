import React, { useState, useRef } from 'react';
import { Difficulty } from '../types';

interface SpyglassRendererProps {
    difficulty: Difficulty;
    isObservationPhase: boolean;
    children: React.ReactNode;
}

export const SpyglassRenderer: React.FC<SpyglassRendererProps> = ({ difficulty, isObservationPhase, children }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursorVisible, setCursorVisible] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);

    const handleMove = (clientX: number, clientY: number) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            setPosition({ x, y });
            if (!hasMoved) setHasMoved(true);
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        handleMove(e.clientX, e.clientY);
        setCursorVisible(true);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
        setCursorVisible(true);
    };

    const isHard = difficulty === 'Hard';
    const showSpyglass = isHard && isObservationPhase;
    const showBlur = isHard && !isObservationPhase;

    // Spyglass gradient overlay
    // Transparent circle in the middle, dark around it
    const overlayStyle: React.CSSProperties = showSpyglass ? {
        background: `radial-gradient(circle 100px at ${position.x}px ${position.y}px, transparent 0%, rgba(0,0,0,0.98) 25%)`,
    } : {};

    return (
        <div
            ref={containerRef}
            className={`relative rounded-2xl overflow-hidden select-none border-4 border-slate-700/50 shadow-2xl bg-gray-900 mx-auto w-full max-w-2xl aspect-video flex items-center justify-center ${showSpyglass ? 'cursor-none touch-none' : ''}`}
            onMouseMove={showSpyglass ? onMouseMove : undefined}
            onTouchMove={showSpyglass ? onTouchMove : undefined}
            onMouseEnter={() => setCursorVisible(true)}
            onMouseLeave={() => setCursorVisible(false)}
        >
            <div className={`transition-all duration-700 w-full h-full flex items-center justify-center ${showBlur ? 'blur-2xl opacity-30 grayscale' : 'opacity-100'}`}>
                {children}
            </div>

            {/* Spyglass Overlay */}
            {showSpyglass && (
                <div
                    className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300"
                    style={overlayStyle}
                >
                    {/* Spyglass Rim Graphic */}
                    {cursorVisible && (
                        <div
                            className="absolute w-[200px] h-[200px] rounded-full border-4 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)_inset] pointer-events-none"
                            style={{
                                left: position.x - 100,
                                top: position.y - 100,
                            }}
                        >
                            <div className="absolute inset-0 border border-white/10 rounded-full animate-pulse"></div>
                            {/* Crosshairs */}
                            <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-red-500/50 -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-red-500/50 -translate-x-1/2 -translate-y-1/2"></div>
                        </div>
                    )}
                </div>
            )}

            {showSpyglass && !hasMoved && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/80 text-2xl font-bold animate-pulse z-20">
                    <span className="bg-black/50 px-4 py-2 rounded-lg backdrop-blur">Move cursor to search 🕵️</span>
                 </div>
            )}

            {/* Locked/Blurred State Indicator */}
            {showBlur && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="bg-black/60 px-6 py-4 rounded-xl backdrop-blur-md border border-white/10 text-center">
                        <div className="text-4xl mb-2">🔒</div>
                        <div className="text-white font-bold text-lg">Image Locked</div>
                        <div className="text-gray-400 text-sm">Recall from memory!</div>
                    </div>
                </div>
            )}
        </div>
    );
};
