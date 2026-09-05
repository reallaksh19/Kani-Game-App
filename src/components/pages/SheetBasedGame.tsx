import React, { useState, useEffect } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { DifficultyBadge } from '../shared/DifficultyBadge';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { GameOverScreen } from '../shared/GameOverScreen';
import { StoryNebulaRenderer, InferenceInvestigatorRenderer } from '../../renderers/ComprehensionRenderer';
import { VocabularyRenderer } from '../../renderers/VocabularyRenderer';
import { SpyglassRenderer } from '../../renderers/SpyglassRenderer';
import { StoryJammerRenderer } from '../../renderers/StoryJammerRenderer';
import { useAppContext } from '../../contexts/AppContext';
import { useGameLogic } from '../../hooks/useGameLogic';
import { GAME_THEMES } from '../../themes/themeConfig';
import { Settings, Difficulty } from '../../types';

interface SheetBasedGameProps {
    onBack: () => void;
    difficulty: Difficulty;
    settings: Settings;
    gameId: string;
    title: string | undefined;
    icon: string | undefined;
    color: string | undefined;
    variant: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const SHAPES: Record<string, string> = {
    triangle: '△', square: '□', circle: '○',
    rectangle: '▭', pentagon: '⬠', hexagon: '⬡',
    octagon: '⬢', star: '⭐', rhombus: '♢', trapezoid: '⏢'
};

// Dynamic Image Renderer Component
const DynamicImageRenderer = ({ url }: { url: string }) => {
    if (!url) return null;

    if (!url.startsWith('dynamic:')) {
        return (
            <div className="flex justify-center mb-4">
                <img
                    src={url}
                    alt="Question Visual"
                    className="max-w-full max-h-[300px] rounded-lg shadow-lg object-contain"
                />
            </div>
        );
    }

    const parts = url.split(':');
    const type = parts[1];

    if (type === 'scene') {
        const sceneType = parts[2];

        if (sceneType === 'park') {
            return (
                <svg width="100%" height="100%" viewBox="0 0 400 300" className="rounded-lg shadow-inner bg-sky-300">
                    {/* Sky & Sun */}
                    <circle cx="350" cy="50" r="30" fill="#FDB813" className="animate-pulse" />

                    {/* Ground */}
                    <rect x="0" y="200" width="400" height="100" fill="#4ADE80" />

                    {/* Tree */}
                    <rect x="50" y="150" width="30" height="100" fill="#78350F" />
                    <circle cx="65" cy="140" r="40" fill="#15803D" />
                    <circle cx="40" cy="160" r="30" fill="#166534" />
                    <circle cx="90" cy="160" r="30" fill="#166534" />

                    {/* Bench */}
                    <rect x="150" y="210" width="80" height="10" fill="#92400E" />
                    <rect x="160" y="220" width="10" height="20" fill="#78350F" />
                    <rect x="210" y="220" width="10" height="20" fill="#78350F" />

                    {/* Dogs - Simple shapes */}
                    <g transform="translate(200, 240)">
                        {/* Dog 1 */}
                        <ellipse cx="0" cy="0" rx="15" ry="10" fill="#D97706" />
                        <circle cx="-15" cy="-5" r="8" fill="#D97706" />
                        <path d="M-10,5 L-12,15 M10,5 L12,15" stroke="#D97706" strokeWidth="4" />
                        <path d="M-15,-5 L-25,0" stroke="#D97706" strokeWidth="4" /> {/* Tail */}
                    </g>
                    <g transform="translate(280, 250) scale(-1, 1)">
                         {/* Dog 2 */}
                        <ellipse cx="0" cy="0" rx="18" ry="12" fill="#57534E" />
                        <circle cx="-18" cy="-6" r="9" fill="#57534E" />
                        <path d="M-12,6 L-14,18 M12,6 L14,18" stroke="#57534E" strokeWidth="4" />
                    </g>
                </svg>
            );
        }

        if (sceneType === 'beach') {
             return (
                <svg width="100%" height="100%" viewBox="0 0 400 300" className="rounded-lg shadow-inner bg-sky-300">
                    {/* Sun */}
                    <circle cx="50" cy="50" r="30" fill="#FDB813" />

                    {/* Ocean */}
                    <rect x="0" y="150" width="400" height="150" fill="#3B82F6" />

                    {/* Sand */}
                    <path d="M0,220 Q200,200 400,220 L400,300 L0,300 Z" fill="#FCD34D" />

                    {/* Umbrella */}
                    <path d="M150,230 L150,150" stroke="#DC2626" strokeWidth="5" />
                    <path d="M100,150 Q150,100 200,150 Z" fill="#EF4444" />
                    <path d="M100,150 Q125,125 150,150" fill="none" stroke="white" strokeWidth="2" />
                    <path d="M150,150 Q175,125 200,150" fill="none" stroke="white" strokeWidth="2" />

                    {/* Beach Ball - Red and Blue stripes */}
                    <g transform="translate(250, 260)">
                        <circle cx="0" cy="0" r="20" fill="white" />
                        <path d="M0,-20 A20,20 0 0,1 0,20" fill="#EF4444" />
                        <path d="M0,-20 A20,20 0 0,0 0,20" fill="#3B82F6" />
                    </g>
                </svg>
             );
        }

        if (sceneType === 'classroom') {
             return (
                <svg width="100%" height="100%" viewBox="0 0 400 300" className="rounded-lg shadow-inner bg-orange-100">
                    {/* Blackboard */}
                    <rect x="50" y="40" width="300" height="120" fill="#1F2937" rx="5" />
                    <rect x="60" y="150" width="280" height="5" fill="#9CA3AF" />

                    {/* Floor */}
                    <rect x="0" y="220" width="400" height="80" fill="#B45309" />

                    {/* Desk */}
                    <path d="M50,250 L80,200 L180,200 L150,250 Z" fill="#D97706" /> {/* Top */}
                    <rect x="50" y="250" width="10" height="40" fill="#92400E" />
                    <rect x="150" y="250" width="10" height="40" fill="#92400E" />
                    <rect x="170" y="200" width="10" height="50" fill="#92400E" />

                    {/* Red Book on Desk */}
                    <rect x="100" y="210" width="40" height="30" fill="#EF4444" transform="rotate(-10 120 225)" />
                    <rect x="105" y="215" width="30" height="20" fill="white" transform="rotate(-10 120 225)" opacity="0.8" />

                    {/* Chair */}
                    <rect x="250" y="220" width="60" height="10" fill="#4B5563" />
                    <rect x="260" y="230" width="5" height="40" fill="#374151" />
                    <rect x="300" y="230" width="5" height="40" fill="#374151" />
                </svg>
             );
        }
    }

    const renderPie = (num: number, den: number, size = 100) => {
        const center = size / 2;
        const radius = size * 0.45;
        let paths = [];

        // Defs for glossy effect
        const defs = (
            <defs>
                <linearGradient id="sliceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        );

        // Background circle
        paths.push(<circle cx={center} cy={center} r={radius} fill="#1F2937" stroke="#374151" strokeWidth="2" key="bg" />);

        if (den === 0) return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{defs}{paths}</svg>;

        // Slices
        const anglePerSlice = 360 / den;
        for (let i = 0; i < num; i++) {
            const startAngle = i * anglePerSlice - 90;
            const endAngle = (i + 1) * anglePerSlice - 90;

            const x1 = center + radius * Math.cos(startAngle * Math.PI / 180);
            const y1 = center + radius * Math.sin(startAngle * Math.PI / 180);
            const x2 = center + radius * Math.cos(endAngle * Math.PI / 180);
            const y2 = center + radius * Math.sin(endAngle * Math.PI / 180);

            const largeArcFlag = anglePerSlice > 180 ? 1 : 0;

            // For a full circle (1/1), SVG arc path gets tricky, so we handle it simply
            if (den === 1 && num === 1) {
                paths.push(<circle cx={center} cy={center} r={radius} fill="url(#sliceGrad)" key={`slice-${i}`} filter="url(#glow)" />);
            } else {
                paths.push(
                    <path
                        d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill="url(#sliceGrad)"
                        stroke="white"
                        strokeWidth="1"
                        key={`slice-${i}`}
                        filter="url(#glow)"
                    />
                );
            }
        }
        return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{defs}{paths}</svg>;
    };

    const renderCoin = (coinType: string, count: number) => {
        const coins = [];
        for (let i = 0; i < count; i++) {
            let color = "#E5E7EB"; // Silver default
            let size = 40;
            let text = "";
            let borderColor = "#9CA3AF";

            if (coinType === 'penny') {
                color = "#B45309"; // Copper
                borderColor = "#78350F";
                size = 36;
                text = "1¢";
            } else if (coinType === 'nickel') {
                color = "#D1D5DB"; // Nickel
                borderColor = "#6B7280";
                size = 44;
                text = "5¢";
            } else if (coinType === 'dime') {
                color = "#E5E7EB"; // Silver
                borderColor = "#9CA3AF";
                size = 32; // Smallest
                text = "10¢";
            } else if (coinType === 'quarter') {
                color = "#F3F4F6"; // Silver/White
                borderColor = "#4B5563";
                size = 52; // Largest
                text = "25¢";
            }

            coins.push(
                <div key={`${coinType}-${i}`} className="relative flex items-center justify-center rounded-full shadow-lg"
                    style={{
                        width: size, height: size,
                        background: `radial-gradient(circle at 30% 30%, #fff, ${color})`,
                        border: `2px solid ${borderColor}`,
                        margin: '4px'
                    }}>
                    <span className="font-bold text-gray-700 text-xs shadow-white drop-shadow-sm">{text}</span>
                </div>
            );
        }
        return coins;
    };

    if (type === 'fraction') {
        const num = parseInt(parts[2]);
        const den = parseInt(parts[3]);
        return <div className="mb-4">{renderPie(num, den, 120)}</div>;
    }

    if (type === 'compare') {
        const n1 = parseInt(parts[2]);
        const d1 = parseInt(parts[3]);
        const n2 = parseInt(parts[4]);
        const d2 = parseInt(parts[5]);
        return (
            <div className="flex items-center gap-8 mb-4">
                <div className="flex flex-col items-center">
                    {renderPie(n1, d1, 100)}
                    <span className="text-white mt-2 font-bold">{n1}/{d1}</span>
                </div>
                <div className="text-4xl text-yellow-400 font-bold">VS</div>
                <div className="flex flex-col items-center">
                    {renderPie(n2, d2, 100)}
                    <span className="text-white mt-2 font-bold">{n2}/{d2}</span>
                </div>
            </div>
        );
    }

    if (type === 'add') {
        const n1 = parseInt(parts[2]);
        const d1 = parseInt(parts[3]);
        const n2 = parseInt(parts[4]);
        const d2 = parseInt(parts[5]);
        return (
            <div className="flex items-center gap-4 mb-4">
                <div className="flex flex-col items-center">
                    {renderPie(n1, d1, 80)}
                </div>
                <div className="text-4xl text-white font-bold">+</div>
                <div className="flex flex-col items-center">
                    {renderPie(n2, d2, 80)}
                </div>
                <div className="text-4xl text-white font-bold">=</div>
                <div className="text-4xl text-yellow-400 font-bold">?</div>
            </div>
        );
    }

    if (type === 'coins') {
        // dynamic:coins:quarter:2:dime:1...
        const coinGroups = [];
        for (let i = 2; i < parts.length; i += 2) {
            const cType = parts[i];
            const cCount = parseInt(parts[i + 1]);
            coinGroups.push(...renderCoin(cType, cCount));
        }
        return <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-md">{coinGroups}</div>;
    }

    if (type === 'shape') {
        const shape = parts[2];
        const size = 120;
        const color = "#EC4899"; // Pink

        const defs = (
            <defs>
                <linearGradient id="shapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F472B6" />
                    <stop offset="100%" stopColor="#DB2777" />
                </linearGradient>
                <filter id="shadow">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.5" />
                </filter>
            </defs>
        );

        let path = null;
        if (shape === 'square') path = <rect x="20" y="20" width="80" height="80" fill="url(#shapeGrad)" />;
        if (shape === 'circle') path = <circle cx="60" cy="60" r="45" fill="url(#shapeGrad)" />;
        if (shape === 'triangle') path = <polygon points="60,15 105,95 15,95" fill="url(#shapeGrad)" />;
        if (shape === 'rectangle') path = <rect x="10" y="35" width="100" height="50" fill="url(#shapeGrad)" />;
        if (shape === 'pentagon') path = <polygon points="60,10 108,45 90,100 30,100 12,45" fill="url(#shapeGrad)" />;
        if (shape === 'hexagon') path = <polygon points="60,10 105,35 105,85 60,110 15,85 15,35" fill="url(#shapeGrad)" />;
        if (shape === 'octagon') path = <polygon points="41,10 79,10 106,37 106,75 79,102 41,102 14,75 14,37" fill="url(#shapeGrad)" />;
        if (shape === 'star') path = <polygon points="60,10 75,45 115,45 85,70 95,110 60,85 25,110 35,70 5,45 45,45" fill="url(#shapeGrad)" />;
        if (shape === 'rhombus') path = <polygon points="60,10 100,60 60,110 20,60" fill="url(#shapeGrad)" />;
        if (shape === 'trapezoid') path = <polygon points="30,20 90,20 110,100 10,100" fill="url(#shapeGrad)" />;
        if (shape === 'oval') path = <ellipse cx="60" cy="60" rx="50" ry="30" fill="url(#shapeGrad)" />;
        if (shape === 'heart') path = <path d="M60,100 L20,60 A20,20 0 0 1 60,30 A20,20 0 0 1 100,60 Z" fill="url(#shapeGrad)" transform="translate(0, -10) scale(1.0)" />;
        if (shape === 'arrow') path = <polygon points="20,40 80,40 80,20 110,60 80,100 80,80 20,80" fill="url(#shapeGrad)" />;
        if (shape === 'cross') path = <path d="M40,10 L80,10 L80,40 L110,40 L110,80 L80,80 L80,110 L40,110 L40,80 L10,80 L10,40 L40,40 Z" fill="url(#shapeGrad)" />;
        if (shape === 'semicircle') path = <path d="M10,60 A50,50 0 0 1 110,60 Z" fill="url(#shapeGrad)" />;
        if (shape === 'cube') {
             return (
                 <svg width={size} height={size} viewBox="0 0 120 120" stroke="white" strokeWidth="2" fill="none">
                     <rect x="30" y="30" width="60" height="60" fill="url(#shapeGrad)" opacity="0.9" filter="url(#shadow)" />
                     <path d="M30,30 L50,10 L110,10 L90,30" fill="url(#shapeGrad)" opacity="0.7" />
                     <path d="M90,30 L110,10 L110,70 L90,90" fill="url(#shapeGrad)" opacity="0.6" />
                 </svg>
             );
        }
        if (shape === 'sphere') {
            return (
                <svg width={size} height={size} viewBox="0 0 120 120">
                    <defs>
                        <radialGradient id="sphereGrad" cx="30%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
                            <stop offset="100%" stopColor={color} />
                        </radialGradient>
                    </defs>
                    <circle cx="60" cy="60" r="45" fill={color} />
                    <circle cx="60" cy="60" r="45" fill="url(#sphereGrad)" filter="url(#shadow)" />
                </svg>
            );
        }

        return <svg width={size} height={size} viewBox="0 0 120 120" filter="url(#shadow)">{defs}{path}</svg>;
    }

    return null;
};

export const SheetBasedGame: React.FC<SheetBasedGameProps> = ({ onBack, difficulty, settings, gameId, title, icon, variant }) => {
    const { addLeaderboardEntry } = useAppContext();

    const handleGameEnd = async (game: string, name: string, stars: number, streak: number, hintsUsed: number) => {
        await addLeaderboardEntry({ game, name, stars, streak, date: new Date().toISOString(), hintsUsed });
    };

    const {
        gameState: { stars, timer, gameActive, gameOver, currentQ, streak, maxStreak, feedback, playerName, scoreSaved, currentIndex, totalQuestions, answers, hintLogs, totalHintsUsed },
        setters: { setPlayerName },
        actions: { startGame, handleAnswer, handleSaveScore, navigateQuestion, toggleHint },
        data: { loading, error, questionsCount }
    } = useGameLogic(gameId, difficulty, settings, handleGameEnd);

    const [readingPhase, setReadingPhase] = useState(false);
    const [showHintModal, setShowHintModal] = useState(false);
    const [observationMode, setObservationMode] = useState(false);

    useEffect(() => {
        if (gameActive && gameId === 'story-nebula') {
            setReadingPhase(true);
        } else {
            setReadingPhase(false);
        }
    }, [gameActive, gameId]);

    useEffect(() => {
        if (gameActive && gameId === 'spyglass-explorer') {
            setObservationMode(true);
        }
    }, [gameActive, gameId, currentIndex]);

    // Derived state
    const isAnswered = !!answers[currentIndex];
    const answerState = answers[currentIndex];
    const showHint = !!hintLogs[currentIndex];
    const safeTitle = title || 'Game';
    const safeIcon = icon || '🎮';
    const safeAnswer = currentQ?.answer || '';
    const safeHint = currentQ?.hint || '';
    const safeExplanation = feedback?.explanation || '';

    // Determine button styles based on answer state
    const getButtonStyle = (opt: string, baseStyle: string) => {
        if (isAnswered) {
            if (opt === safeAnswer) return 'bg-green-500 text-white scale-105';
            if (opt === answerState.selected) return 'bg-red-500 text-white opacity-80';
            return 'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed';
        }
        return `${baseStyle} text-white hover:scale-105 cursor-pointer`;
    };

    const gameTheme = GAME_THEMES[gameId];
    // Auto-select background based on theme or variant
    const background = gameTheme ? `linear-gradient(135deg, var(--theme-secondary, #1a1a2e) 0%, ${gameTheme.gradient.includes('to-') ? 'rgba(0,0,0,0.8)' : gameTheme.gradient} 100%)` : variant;

    // Render question based on game type
    const renderQuestion = () => {
        if (!currentQ) return <p className="text-white">No questions available</p>;

        const commonImage = currentQ.image_url ? <DynamicImageRenderer url={currentQ.image_url} /> : null;

        // Hint Button
        const handleHintClick = () => {
            toggleHint();
            if (gameId === 'story-nebula' || gameId === 'story-jammer') {
                setShowHintModal(true);
            }
        };

        const HintButton = () => safeHint ? (
            <button
                onClick={handleHintClick}
                className={`absolute top-0 right-0 p-2 rounded-full transition-all ${showHint ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Show Hint"
            >
                💡
            </button>
        ) : null;

        // Story Jammer
        if (gameId === 'story-jammer') {
            return (
                <div className="relative">
                    <HintButton />
                    <StoryJammerRenderer
                        currentQ={currentQ}
                        handleAnswer={(opt) => !isAnswered && handleAnswer(opt, safeAnswer)}
                        feedback={isAnswered ? { correct: answerState.isCorrect, answer: safeAnswer } : null}
                        gameTheme={gameTheme || GAME_THEMES['story-jammer']}
                        questionIndex={currentIndex}
                    />
                </div>
            );
        }

        // Spyglass Explorer
        if (gameId === 'spyglass-explorer') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            const effectiveDifficulty = (showHint && !observationMode) ? 'Easy' : difficulty;

            return (
                <div className="w-full max-w-4xl relative animate-slideIn flex flex-col items-center">
                    <div className="mb-6 w-full flex flex-col items-center">
                        <div className="text-center mb-4">
                            <h3 className="text-2xl font-bold text-white mb-2">{currentQ.text1}</h3>
                            <p className="text-teal-300 font-bold">
                                {observationMode ? "👀 Observe the scene carefully!" : "❓ Recall the details!"}
                            </p>
                        </div>

                        <SpyglassRenderer
                            difficulty={effectiveDifficulty}
                            isObservationPhase={observationMode}
                        >
                            {currentQ.image_url ? <DynamicImageRenderer url={currentQ.image_url} /> : null}
                        </SpyglassRenderer>
                    </div>

                    {observationMode ? (
                        <button
                            onClick={() => setObservationMode(false)}
                            className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-teal-500/30 animate-pulse cursor-pointer"
                        >
                            I'm Ready! 🕵️
                        </button>
                    ) : (
                        <div className="w-full max-w-lg animate-slideIn">
                            <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                                <HintButton />
                                <div className="text-white text-2xl font-bold mb-4">{currentQ.text2}</div>
                                {showHint && safeHint && <p className="text-gray-400 text-sm animate-slideIn">💡 {safeHint}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3 relative z-20">
                                {options.map((opt, i) => (
                                    <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                        disabled={isAnswered}
                                        className={`p-4 rounded-xl text-xl font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-teal-600 to-emerald-600')}`}>{opt}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Math equations (Adding fraction-exam here)
        if (['space-math', 'alien-invasion', 'bubble-pop', 'fraction-frenzy', 'geometry-galaxy', 'fraction-exam'].includes(gameId)) {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            const showEquation = gameId !== 'geometry-galaxy' &&
                                 (!commonImage || currentQ.operation === 'fill-blank') &&
                                 !(gameId === 'fraction-exam' && currentQ.text1 && currentQ.operation === 'identify');

            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center flex flex-col items-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        {commonImage}
                        {!commonImage && gameId === 'geometry-galaxy' && currentQ.operation === 'identify' && (
                            <div className="text-8xl mb-4">{SHAPES[(currentQ.text1 || '').toLowerCase()] || '?'}</div>
                        )}
                        {showEquation && (
                            <div className="text-white text-4xl font-bold mb-2">
                                {currentQ.operation === 'fill-blank' ? (
                                    <span>{currentQ.num1} = {currentQ.num2}</span>
                                ) : (
                                    <>
                                        {currentQ.num1} {currentQ.operation} {currentQ.num2} {currentQ.operation && '= ?'}
                                        {(gameId === 'fraction-frenzy' || gameId === 'fraction-exam') && currentQ.operation === 'identify' && currentQ.num1 && !currentQ.num2 && <span>{currentQ.num1}</span>}
                                    </>
                                )}
                            </div>
                        )}
                        {gameId === 'geometry-galaxy' && currentQ.operation === 'sides' && <div className="text-white text-2xl mb-4">How many sides does a {currentQ.text1} have?</div>}

                        {currentQ.text1 && !commonImage && gameId !== 'geometry-galaxy' && (
                            <div className="text-white text-xl font-bold mb-2">{currentQ.text1}</div>
                        )}

                        {showHint && safeHint && <p className="text-gray-400 text-sm mt-2 animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-2xl font-bold transition-all ${getButtonStyle(opt, gameTheme?.buttonBg || 'bg-blue-600')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Story Solver - Word problems
        if (gameId === 'story-solver') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-violet-300 text-sm mb-3">📖 Read carefully and solve!</div>
                        <div className="bg-violet-500/20 rounded-xl p-4 mb-4">
                            <div className="text-white text-lg leading-relaxed">{currentQ.text1}</div>
                        </div>
                        {currentQ.text2 && (
                            <div className="text-yellow-300 text-center font-medium">{currentQ.text2}</div>
                        )}
                        {showHint && safeHint && <p className="text-gray-400 text-sm mt-3 text-center animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-xl font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-violet-500 to-purple-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Estimation Express - Quick estimates
        if (gameId === 'estimation-express') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-amber-300 text-sm mb-3">🎯 Estimate quickly! About how much?</div>
                        <div className="text-white text-4xl font-bold mb-4">
                            {currentQ.num1} {currentQ.operation} {currentQ.num2} ≈ ?
                        </div>
                        {showHint && safeHint && <p className="text-gray-400 text-sm animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-2xl font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-amber-500 to-red-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Pattern Planet - Visual/numerical patterns
        if (gameId === 'pattern-planet') {
            const patternParts = currentQ.text1 ? currentQ.text1.split(' ') : [];
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-fuchsia-300 text-sm mb-4">🔮 What comes next?</div>
                        <div className="flex justify-center gap-3 mb-4 flex-wrap">
                            {patternParts.map((part, i) => (
                                <div key={i}
                                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg border-2
                                        ${part === '?'
                                            ? 'bg-fuchsia-500/30 border-fuchsia-400 text-fuchsia-300 animate-pulse'
                                            : 'bg-gradient-to-br from-fuchsia-500 to-pink-500 border-fuchsia-300/50 text-white'
                                        }`}
                                    style={{ animation: part !== '?' ? `float ${2 + i * 0.2}s ease-in-out infinite` : undefined }}
                                >
                                    {part}
                                </div>
                            ))}
                        </div>
                        {currentQ.text2 && <div className="text-gray-400 text-sm">{currentQ.text2}</div>}
                        {showHint && safeHint && <p className="text-gray-400 text-sm mt-2 animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-2xl font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-fuchsia-500 to-pink-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Measurement Mission - Length, weight, capacity
        if (gameId === 'measurement-mission') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            const measureIcons: Record<string, string> = {
                length: '📏',
                weight: '⚖️',
                capacity: '🫗',
                time: '⏱️',
                temperature: '🌡️'
            };
            const measureType = currentQ.operation || 'length';
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-sky-300 text-sm mb-3">{measureIcons[measureType] || '📏'} Measurement Mission!</div>
                        <div className="text-white text-xl leading-relaxed mb-4">{currentQ.text1}</div>
                        {currentQ.text2 && <div className="text-sky-300 text-lg font-medium">{currentQ.text2}</div>}
                        {showHint && safeHint && <p className="text-gray-400 text-sm mt-3 animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-sky-500 to-blue-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Sequences (planet-hopper)
        if (gameId === 'planet-hopper') {
            const seqParts = currentQ.num1 ? currentQ.num1.split(' ') : [];
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="flex justify-center gap-2 mb-6 flex-wrap">
                            {seqParts.map((part, i) => (
                                <div key={i} className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg border-4 border-white/30 ${part === '?' ? 'bg-gray-600' : 'bg-gradient-to-b from-purple-400 to-purple-600'
                                    }`} style={{ animation: 'float 3s ease-in-out infinite' }}>
                                    {part}
                                </div>
                            ))}
                        </div>
                        <p className="text-white text-center mb-4">Find the missing number!</p>
                        {showHint && safeHint && <p className="text-gray-400 text-sm text-center mb-4 animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-xl font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-purple-500 to-pink-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Grammar
        if (gameId === 'grammar-galaxy') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-xs text-purple-400 mb-2">{currentQ.text2}</div>
                        <div className="text-white text-2xl font-medium text-center">"{currentQ.text1}"</div>
                    </div>
                    <p className="text-purple-200 text-center mb-4">Choose the correct word:</p>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-purple-600 to-indigo-600')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Word class
        if (gameId === 'word-class-warp') {
            const categories = ['noun', 'verb', 'adjective', 'adverb'];
            const icons_map = { noun: '📦', verb: '🏃', adjective: '🎨', adverb: '⚡' };
            const colors_map: Record<string, string> = { noun: 'from-red-500 to-orange-500', verb: 'from-green-500 to-emerald-500', adjective: 'from-blue-500 to-purple-500', adverb: 'from-yellow-500 to-amber-500' };
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-8 backdrop-blur mb-8 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-4xl font-bold text-white" style={{ animation: 'float 2s ease-in-out infinite' }}>{currentQ.text1}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 relative z-20">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => !isAnswered && handleAnswer(cat, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-6 rounded-2xl text-white font-bold text-lg transition-all ${isAnswered
                                    ? (cat === safeAnswer ? 'bg-green-500' : (cat === answerState.selected ? 'bg-red-500' : 'bg-gray-700 opacity-50'))
                                    : `bg-gradient-to-br ${colors_map[cat]} hover:scale-105 cursor-pointer`
                                    }`}>
                                <div className="text-3xl mb-2">{icons_map[cat as keyof typeof icons_map]}</div>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        // Punctuation
        if (gameId === 'punctuation-pop') {
            const marks = ['.', '?', '!', ','];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-white text-2xl font-medium text-center">
                            {currentQ.text1}<span className="text-yellow-400 text-3xl animate-pulse">_</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 relative z-20">
                        {marks.map(mark => (
                            <button key={mark} onClick={() => !isAnswered && handleAnswer(mark, safeAnswer)}
                                disabled={isAnswered}
                                className={`w-16 h-16 rounded-full text-3xl font-bold transition-all ${isAnswered
                                    ? (mark === safeAnswer ? 'bg-green-500 text-white' : (mark === answerState.selected ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400 opacity-50'))
                                    : 'bg-gradient-to-b from-pink-400 to-rose-500 text-white hover:scale-110 cursor-pointer'
                                    }`}>{mark}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Tenses
        if (gameId === 'tense-traveler') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            const tenseColors: Record<string, string> = { past: 'from-amber-600 to-orange-700', present: 'from-green-500 to-emerald-600', future: 'from-blue-500 to-indigo-600' };
            const tenseIcons: Record<string, string> = { past: '⏪', present: '▶️', future: '⏩' };
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className={`bg-gradient-to-r ${tenseColors[currentQ.text2 || ''] || 'from-gray-500 to-gray-600'} rounded-2xl p-4 mb-4 text-center shadow-lg border border-white/20`}>
                        <div className="text-3xl mb-1">{tenseIcons[currentQ.text2 || ''] || '🕐'}</div>
                        <div className="text-white text-xl font-bold">{(currentQ.text2 || 'TENSE').toUpperCase()}</div>
                    </div>
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-gray-400 text-sm mb-2">Convert this verb:</div>
                        <div className="text-white text-4xl font-bold">{currentQ.text1}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-teal-600 to-emerald-600')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Sentence Builder
        if (gameId === 'sentence-builder') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            const scrambledWords = currentQ.text1 ? currentQ.text1.split('|').map(w => w.trim()) : [];
            return (
                <div className="w-full max-w-lg animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-cyan-300 text-sm mb-4">🏗️ Put words in order!</div>
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {scrambledWords.map((word, i) => (
                                <span key={i} className="bg-cyan-500/30 border border-cyan-400/50 px-3 py-2 rounded-lg text-white">{word}</span>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-cyan-500 to-teal-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Contraction Commander
        if (gameId === 'contraction-commander') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-rose-300 text-sm mb-3">✂️ What is the contraction for:</div>
                        <div className="bg-rose-500/20 border-2 border-rose-400/50 rounded-xl p-4">
                            <div className="text-white text-3xl font-bold">{currentQ.text1}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-2xl font-bold ${getButtonStyle(opt, 'bg-gradient-to-r from-rose-500 to-pink-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Article Adventure
        if (gameId === 'article-adventure') {
            const articles = ['a', 'an', 'the'];
            return (
                <div className="w-full max-w-lg animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-lime-300 text-sm mb-4">📰 Choose the correct article!</div>
                        <div className="text-white text-2xl">
                            <span className="text-yellow-400 text-3xl font-bold animate-pulse">___</span> {currentQ.text1}
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 relative z-20">
                        {articles.map((article) => (
                            <button key={article} onClick={() => !isAnswered && handleAnswer(article, safeAnswer)}
                                disabled={isAnswered}
                                className={`w-20 h-20 rounded-2xl text-3xl font-bold ${getButtonStyle(article, 'bg-gradient-to-b from-lime-400 to-green-500')}`}>{article}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Synonyms & Antonyms
        if (gameId === 'synonym-stars' || gameId === 'antonym-asteroids') {
            const options = shuffleArray([safeAnswer, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[]);
            const isSynonym = gameId === 'synonym-stars';
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-green-300 text-sm mb-2">Find {isSynonym ? 'a word that means the same as' : 'the OPPOSITE of'}:</div>
                        <div className="text-white text-4xl font-bold">{currentQ.text1}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all ${getButtonStyle(opt, `bg-gradient-to-r ${isSynonym ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-orange-500'}`)}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // New Vocabulary Games
        if (['word-wizard', 'root-raider', 'idiom-island', 'homophone-hunt'].includes(gameId)) {
            return (
                <div className="relative">
                    <HintButton />
                    <VocabularyRenderer
                        gameId={gameId}
                        currentQ={currentQ}
                        showHint={showHint}
                        safeHint={safeHint}
                        safeExplanation={safeExplanation}
                        handleAnswer={(opt) => !isAnswered && handleAnswer(opt, safeAnswer)}
                        feedback={isAnswered ? { correct: answerState.isCorrect, answer: safeAnswer } : null}
                        safeAnswer={safeAnswer}
                    />
                </div>
            );
        }

        // Story comprehension
        if (gameId === 'story-nebula') {
            const gameTheme = GAME_THEMES['story-nebula'] || GAME_THEMES['space-math'];
            return (
                <>
                    <div className="relative">
                        <HintButton />
                        <StoryNebulaRenderer
                            currentQ={currentQ}
                            handleAnswer={(opt) => !isAnswered && handleAnswer(opt, safeAnswer)}
                            feedback={isAnswered ? { correct: answerState.isCorrect, answer: safeAnswer } : null}
                            gameTheme={gameTheme}
                        />
                    </div>
                </>
            );
        }

        // Inference
        if (gameId === 'inference-investigator') {
            const gameTheme = GAME_THEMES['inference-investigator'] || GAME_THEMES['space-math'];
            return (
                <>
                <InferenceInvestigatorRenderer
                    currentQ={currentQ}
                    handleAnswer={(opt) => !isAnswered && handleAnswer(opt, safeAnswer)}
                    feedback={isAnswered ? { correct: answerState.isCorrect, answer: safeAnswer } : null}
                    gameTheme={gameTheme}
                />
                </>
            );
        }

        // Time
        if (gameId === 'time-warp') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            const hour = parseInt(currentQ.num1 || '3');
            const minute = parseInt(currentQ.num2 || '0');
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-blue-400 text-sm mb-2">{currentQ.operation === 'read' ? 'Read the Clock' : 'Calculate Duration'}</div>
                        {currentQ.operation === 'read' && (
                            <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto">
                                <circle cx="50" cy="50" r="45" fill="#1f2937" stroke="#fbbf24" strokeWidth="3" />
                                {[...Array(12)].map((_, i) => {
                                    const angle = (i * 30 - 90) * Math.PI / 180;
                                    return <text key={i} x={50 + 35 * Math.cos(angle)} y={50 + 35 * Math.sin(angle) + 4} fill="white" fontSize="10" textAnchor="middle">{i === 0 ? 12 : i}</text>;
                                })}
                                <line x1="50" y1="50" x2={50 + 20 * Math.cos(((hour % 12) * 30 + minute * 0.5 - 90) * Math.PI / 180)} y2={50 + 20 * Math.sin(((hour % 12) * 30 + minute * 0.5 - 90) * Math.PI / 180)} stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                                <line x1="50" y1="50" x2={50 + 30 * Math.cos((minute * 6 - 90) * Math.PI / 180)} y2={50 + 30 * Math.sin((minute * 6 - 90) * Math.PI / 180)} stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        )}
                        {currentQ.operation === 'duration' && <div className="text-white text-xl">From {currentQ.num1} to {currentQ.num2}</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-blue-500 to-indigo-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Money
        if (gameId === 'money-master') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            const isChange = currentQ.num2 === 'change';
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-green-400 text-sm mb-2">{isChange ? '💵 Make Change' : '🪙 Count the Coins'}</div>
                        {commonImage}
                        {!commonImage && <div className="text-white text-2xl font-bold mb-4">{currentQ.num1 || ''}</div>}
                        {showHint && safeHint && <p className="text-gray-400 text-sm animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-2xl font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-green-500 to-emerald-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // ==================== SKILL GAMES ====================

        // Pattern Forge - Complete the pattern
        if (gameId === 'pattern-forge') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            const patternParts = currentQ.text1 ? currentQ.text1.split(' ') : [];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-violet-400 text-sm mb-4">🧩 Complete the pattern!</div>
                        {commonImage}
                        <div className="flex justify-center gap-3 mb-4 flex-wrap">
                            {patternParts.map((part, i) => (
                                <div
                                    key={i}
                                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg border-2 
                                        ${part === '?'
                                            ? 'bg-violet-500/30 border-violet-400 text-violet-300 animate-pulse'
                                            : 'bg-gradient-to-br from-violet-500 to-indigo-600 border-violet-300/50 text-white'
                                        }`}
                                    style={{ animation: part !== '?' ? `float ${2 + i * 0.2}s ease-in-out infinite` : undefined }}
                                >
                                    {part}
                                </div>
                            ))}
                        </div>
                        {showHint && currentQ.hint && <p className="text-gray-400 text-sm animate-slideIn">💡 {currentQ.hint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, currentQ.answer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-xl font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-violet-500 to-indigo-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Logic Lab - Deductive reasoning puzzles
        if (gameId === 'logic-lab') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-emerald-400 text-sm mb-3 text-center">🔍 Solve the puzzle!</div>
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
                            <div className="text-white text-lg leading-relaxed">{currentQ.text1}</div>
                        </div>
                        {currentQ.text2 && (
                            <div className="text-teal-300 text-center text-lg font-medium">{currentQ.text2}</div>
                        )}
                        {showHint && currentQ.hint && <p className="text-gray-400 text-sm mt-3 text-center animate-slideIn">💡 {currentQ.hint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, currentQ.answer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-emerald-500 to-teal-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Odd Wizard - Find the item that doesn't belong
        if (gameId === 'odd-wizard') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-amber-400 text-sm mb-4">🎯 Find the odd one out!</div>
                        {currentQ.text1 && (
                            <div className="text-gray-300 text-sm mb-2">{currentQ.text1}</div>
                        )}
                        {showHint && currentQ.hint && <p className="text-gray-400 text-sm animate-slideIn">💡 {currentQ.hint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, currentQ.answer)}
                                disabled={isAnswered}
                                className={`p-5 rounded-2xl text-xl font-bold transition-all border-2 ${isAnswered
                                    ? (opt === currentQ.answer
                                        ? 'bg-green-500 text-white border-green-400 scale-105 ring-4 ring-green-400/50'
                                        : (opt === answerState.selected ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-700 text-gray-400 border-gray-600 opacity-50'))
                                    : 'bg-gradient-to-br from-amber-500 to-yellow-500 text-white border-amber-300/50 hover:scale-105 hover:shadow-xl'
                                    }`}
                                style={{ animation: `slideIn 0.3s ease-out ${i * 0.1}s both` }}
                            >{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Sorting Station - Put items in order
        if (gameId === 'sorting-station') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-cyan-400 text-sm mb-4">📦 Put in correct order!</div>
                        <div className="text-white text-xl font-medium mb-4">{currentQ.text1}</div>
                        {currentQ.text2 && (
                            <div className="text-blue-300 text-sm">{currentQ.text2}</div>
                        )}
                        {showHint && currentQ.hint && <p className="text-gray-400 text-sm mt-3 animate-slideIn">💡 {currentQ.hint}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, currentQ.answer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all flex items-center gap-3 ${isAnswered
                                    ? (opt === currentQ.answer
                                        ? 'bg-green-500 text-white scale-102'
                                        : 'bg-gray-700 text-gray-400')
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-102 hover:translate-x-2'
                                    }`}
                            >
                                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">{i + 1}</span>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        // Code Breaker - Decode secret messages
        if (gameId === 'code-breaker') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg relative animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-fuchsia-400 text-sm mb-4">🔐 Crack the code!</div>
                        {currentQ.text2 && (
                            <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3 mb-4">
                                <div className="text-purple-300 text-xs mb-1">Cipher Key:</div>
                                <div className="text-white font-mono text-sm">{currentQ.text2}</div>
                            </div>
                        )}
                        <div className="bg-fuchsia-500/20 border-2 border-fuchsia-400/50 rounded-xl p-4 mb-4">
                            <div className="text-fuchsia-200 text-xs mb-2">Decode this:</div>
                            <div className="text-white text-2xl font-bold font-mono tracking-wider">{currentQ.text1}</div>
                        </div>
                        {showHint && currentQ.hint && <p className="text-gray-400 text-sm animate-slideIn">💡 {currentQ.hint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-20">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, currentQ.answer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-purple-500 to-fuchsia-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Cause & Effect
        if (gameId === 'cause-effect') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-yellow-300 text-sm mb-3">⚡ What is the {currentQ.operation === 'cause' ? 'CAUSE' : 'EFFECT'}?</div>
                        <div className="bg-yellow-500/20 rounded-xl p-4 mb-4">
                            <div className="text-white text-xl">{currentQ.text1}</div>
                        </div>
                        {currentQ.text2 && <div className="text-gray-400 text-center mt-3">{currentQ.text2}</div>}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-yellow-500 to-orange-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Analogy Arena
        if (gameId === 'analogy-arena') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-indigo-300 text-sm mb-4">🔗 Complete the analogy:</div>
                        <div className="text-white text-2xl font-bold">
                            {currentQ.text1} is to {currentQ.text2}
                        </div>
                        <div className="text-indigo-300 text-xl my-2">as</div>
                        <div className="text-white text-2xl font-bold">
                            {currentQ.num1} is to <span className="text-yellow-400 animate-pulse">?</span>
                        </div>
                        {showHint && safeHint && <p className="text-gray-400 text-sm mt-3 animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-xl font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-indigo-500 to-violet-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Sequence Story
        if (gameId === 'sequence-story') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-teal-300 text-sm mb-3">📝 What happens next?</div>
                        <div className="text-white text-lg leading-relaxed">{currentQ.text1}</div>
                        {currentQ.text2 && <div className="text-yellow-300 mt-3 font-medium text-center">{currentQ.text2}</div>}
                        {showHint && safeHint && <p className="text-gray-400 text-sm mt-3 text-center animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all text-left ${getButtonStyle(opt, 'bg-gradient-to-r from-teal-500 to-cyan-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // Classify Quest
        if (gameId === 'classify-quest') {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            return (
                <div className="w-full max-w-lg animate-slideIn">
                    <div className="bg-gray-900/80 rounded-2xl p-6 backdrop-blur mb-6 text-center border border-white/10 shadow-2xl relative">
                        <HintButton />
                        <div className="text-rose-300 text-sm mb-3">📊 Which category does this belong to?</div>
                        <div className="bg-rose-500/20 rounded-xl p-4 mb-4">
                            <div className="text-white text-3xl font-bold">{currentQ.text1}</div>
                        </div>
                        {showHint && safeHint && <p className="text-gray-400 text-sm animate-slideIn">💡 {safeHint}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {options.map((opt, i) => (
                            <button key={i} onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-lg font-bold transition-all ${getButtonStyle(opt, 'bg-gradient-to-r from-rose-500 to-red-500')}`}>{opt}</button>
                        ))}
                    </div>
                </div>
            );
        }

        // LQ Champ Olympiad Lots (LogIQids Style)
        if (gameId.startsWith('lq-')) {
            const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[];
            const selectedOption = answerState?.selected;
            const selectedIndex = selectedOption ? options.indexOf(selectedOption) : -1;
            const selectedLetter = selectedIndex >= 0 ? String.fromCharCode(65 + selectedIndex) : '';
            const passRate = currentQ.difficulty === 'Hard' ? '31%' : '56%';

            return (
                <div className="w-full max-w-3xl relative animate-slideIn pb-24">
                    {/* LogIQids Question Card */}
                    <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-purple-200 text-gray-800">
                        {/* Purple Header */}
                        <div className="bg-[#5c4fd6] text-white px-6 py-2.5 text-center font-bold text-sm tracking-wide flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-purple-200">🏆 Thinksheet Mode</span>
                            <span className="font-extrabold text-base">LQ Champ Section</span>
                            <span className="text-xs text-purple-200">Question {currentIndex + 1} of {totalQuestions}</span>
                        </div>

                        <div className="p-6">
                            {/* Meta Row: Category Pill, Difficulty */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="bg-purple-100 text-purple-800 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                                    {currentQ.text2 || 'Logical Reasoning'}
                                </span>
                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                    <span className={currentQ.difficulty === 'Hard' ? 'text-red-500' : 'text-amber-500'}>●</span>
                                    <span className={currentQ.difficulty === 'Hard' ? 'text-red-600' : 'text-amber-700'}>
                                        {currentQ.difficulty || 'Medium'}
                                    </span>
                                </div>
                            </div>

                            {/* Question Title & Text */}
                            <h2 className="text-lg font-black text-purple-950 mb-1">
                                Question {String(currentIndex + 1).padStart(2, '0')}
                            </h2>
                            <div className="text-gray-900 text-lg sm:text-xl font-medium leading-relaxed mb-4 whitespace-pre-line">
                                {currentQ.text1}
                            </div>

                            {/* User Answer, Time & Pass Rate Bar (LogIQids Style) */}
                            <div className="flex flex-wrap items-center gap-3 py-2 border-y border-gray-100 my-4 text-xs font-bold text-gray-500">
                                {isAnswered && (
                                    <span className={`px-3 py-1 rounded-full font-extrabold flex items-center gap-1.5 ${
                                        answerState.isCorrect 
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                                    }`}>
                                        Your Answer: {selectedLetter ? `${selectedLetter}. ` : ''}{selectedOption}
                                        <span>{answerState.isCorrect ? '✓' : '✗'}</span>
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-gray-600">
                                    <span>👥</span>
                                    <span>{passRate} users solved it right</span>
                                </span>
                                <span className="flex items-center gap-1 text-gray-500 ml-auto">
                                    <span>⏱️ Time:</span>
                                    <span>{Math.floor(timer / 60)}m {timer % 60}s</span>
                                </span>
                            </div>

                            {/* Hint Button & Drawer */}
                            {safeHint && (
                                <div className="mb-4">
                                    <button
                                        onClick={handleHintClick}
                                        className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>💡</span>
                                        <span>{showHint ? 'Hide Clue' : 'Need a Detective Clue?'}</span>
                                    </button>
                                    {showHint && (
                                        <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-900 text-sm animate-slideIn">
                                            <strong>Detective Tip:</strong> {safeHint}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 4 Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {options.map((opt, i) => {
                                    const letter = String.fromCharCode(65 + i);
                                    let btnStyle = 'bg-gray-50 hover:bg-purple-50 text-gray-800 border-2 border-gray-200 hover:border-purple-300';
                                    let badge = null;

                                    if (isAnswered) {
                                        if (opt === safeAnswer) {
                                            btnStyle = 'bg-emerald-50 text-emerald-900 border-2 border-emerald-500 font-black shadow-sm';
                                            badge = <span className="text-emerald-600 font-extrabold">✓</span>;
                                        } else if (opt === selectedOption) {
                                            btnStyle = 'bg-rose-50 text-rose-900 border-2 border-rose-400 font-bold';
                                            badge = <span className="text-rose-500 font-extrabold">✗</span>;
                                        } else {
                                            btnStyle = 'bg-gray-50 text-gray-400 border border-gray-200 opacity-60';
                                        }
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => !isAnswered && handleAnswer(opt, safeAnswer)}
                                            disabled={isAnswered}
                                            className={`p-3.5 rounded-2xl text-left text-sm sm:text-base transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-extrabold text-xs text-gray-500">{letter}.</span>
                                                <span className="font-semibold">{opt}</span>
                                            </div>
                                            {badge}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* LogIQids Solution Box (Revealed on Answer) */}
                            {isAnswered && safeExplanation && (
                                <div className="mt-4 p-4 bg-purple-50/80 border border-purple-200 rounded-2xl text-gray-800 animate-slideIn">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-base font-black text-purple-900">Solution :</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                        {safeExplanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return <p className="text-white">Question type not supported</p>;
    };

    if (loading) return <SpaceBackground variant={variant}><div className="flex items-center justify-center h-full"><LoadingSpinner /></div></SpaceBackground>;
    if (error) return <SpaceBackground variant={variant}><div className="flex flex-col items-center justify-center h-full"><p className="text-red-400 mb-4">Error: {error}</p><button onClick={onBack} className="bg-gray-600 text-white px-6 py-3 rounded-full cursor-pointer">Back</button></div></SpaceBackground>;

    return (
        <SpaceBackground variant={background}>
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={(s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`} difficulty={difficulty} progress={{ current: currentIndex + 1, total: totalQuestions }} hintCount={totalHintsUsed} />

            {/* Hint Modal */}
            {showHintModal && gameId === 'story-nebula' && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fadeIn">
                    <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-6 max-w-lg w-full relative m-4 shadow-2xl shadow-yellow-500/20">
                        <button
                            onClick={() => setShowHintModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >✕</button>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">💡</span>
                            <h3 className="text-yellow-400 font-bold text-xl">Story Hint</h3>
                        </div>
                        <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
                            <p className="text-white text-lg leading-relaxed italic">
                                "{safeHint}"
                            </p>
                        </div>
                        <button
                            onClick={() => setShowHintModal(false)}
                            className="mt-6 w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col items-center justify-center h-full pt-20 px-4 pb-20">
                {!gameActive && !gameOver && (
                    <div className="text-center">
                        <h1 className="text-5xl font-bold text-white mb-2">{safeIcon} {safeTitle}</h1>
                        <DifficultyBadge difficulty={difficulty} />
                        <p className="text-gray-300 my-4">{questionsCount} questions loaded for challenge!</p>
                        <button onClick={startGame} disabled={questionsCount === 0}
                            className={`${GAME_THEMES[gameId]?.buttonBg || 'bg-blue-600'} text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer disabled:opacity-50`}>
                            {questionsCount > 0 ? 'START GAME' : 'No Questions Available'}
                        </button>
                    </div>
                )}
                {gameOver && <GameOverScreen stars={stars} streak={maxStreak} onRestart={startGame} onBack={onBack} onSaveScore={handleSaveScore} playerName={playerName} setPlayerName={setPlayerName} scoreSaved={scoreSaved} />}

                {gameActive && (
                    <>
                        {readingPhase ? (
                            <div className="w-full max-w-3xl bg-gray-900/90 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-2xl animate-slideIn flex flex-col items-center max-h-[80vh]">
                                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                    <span>📖</span> {currentQ?.text1}
                                </h2>

                                <div className="flex flex-col md:flex-row gap-6 mb-6 w-full overflow-y-auto custom-scrollbar">
                                    {currentQ?.image_url && (
                                        <div className="flex-shrink-0 mx-auto scale-125 p-4">
                                            <DynamicImageRenderer url={currentQ.image_url} />
                                        </div>
                                    )}
                                    <div className="text-white text-lg leading-relaxed font-medium">
                                        {currentQ?.text2}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setReadingPhase(false)}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-blue-500/30 mt-auto"
                                >
                                    Start Challenge! 🚀
                                </button>
                            </div>
                        ) : (
                            renderQuestion()
                        )}

                        {!readingPhase && isAnswered && (
                            <div className={`mt-4 text-center text-xl font-bold ${answerState.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {answerState.isCorrect ? '✓ Correct!' : `✗ Answer: ${safeAnswer}`}
                            </div>
                        )}

                        {/* Navigation Bar */}
                        <div className="fixed bottom-0 left-0 w-full bg-black/40 backdrop-blur-md border-t border-white/10 p-4 flex justify-between items-center z-50">
                            <button
                                onClick={() => navigateQuestion('prev')}
                                disabled={currentIndex === 0}
                                className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                            >
                                ← Prev
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalQuestions }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${
                                            i === currentIndex ? 'bg-white scale-150' :
                                            answers[i] ? (answers[i].isCorrect ? 'bg-green-500' : 'bg-red-500') : 'bg-white/20'
                                        }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => navigateQuestion('next')}
                                className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                            >
                                {currentIndex === totalQuestions - 1 ? 'Finish' : 'Next →'}
                            </button>
                        </div>
                    </>
                )}

                {safeExplanation && isAnswered && (
                    <div className="mt-4 w-full max-w-lg bg-white/10 rounded-xl p-4 backdrop-blur animate-slideIn mb-20">
                        <h3 className="text-yellow-400 font-bold mb-1">💡 Know More</h3>
                        <p className="text-white text-sm">{safeExplanation}</p>
                    </div>
                )}
            </div>
        </SpaceBackground>
    );
};
