import React, { useState } from 'react';
import { THEME_COLORS } from '../../themes/themeConfig';

interface SpaceBackgroundProps {
    children: React.ReactNode;
    variant?: string;
}

export const SpaceBackground: React.FC<SpaceBackgroundProps> = ({ children, variant = 'default' }) => {
    const [bubbles] = useState(() => Array.from({ length: 30 }, (_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 3 + 1, duration: Math.random() * 3 + 2
    })));
    const gradients: Record<string, string> = {
        default: THEME_COLORS.default.background,
        english: THEME_COLORS.english.background,
        grammar: THEME_COLORS.grammar.background,
        vocabulary: THEME_COLORS.vocabulary.background,
        comprehension: THEME_COLORS.comprehension.background,
        math: THEME_COLORS.math.background,
        lqchamp: 'linear-gradient(180deg, #1c0f04 0%, #3a1e08 50%, #5a2e0a 100%)',
        skill: THEME_COLORS.default.background
    };

    const getBackground = () => {
        if (gradients[variant]) return gradients[variant];
        if (variant.includes('gradient') || variant.includes('#') || variant.includes('rgb')) return variant;
        return gradients.default;
    };

    return (
        <div className="relative w-full h-screen overflow-hidden" style={{ background: getBackground() }}>
            <div className="pointer-events-none absolute inset-0">
                {bubbles.map(bubble => (
                    <div key={bubble.id} className="absolute rounded-full bg-white opacity-60 animate-twinkle"
                        style={{
                            left: `${bubble.x}%`,
                            top: `${bubble.y}%`,
                            width: bubble.size,
                            height: bubble.size,
                            animationDuration: `${bubble.duration}s`
                        }} />
                ))}
            </div>
            <div className="relative z-10 h-full overflow-y-auto">{children}</div>
        </div>
    );
};
