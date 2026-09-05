import React, { useState, useEffect } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';

interface ScaleSenseGameProps {
    onBack: () => void;
    difficulty: Difficulty;
}

export const ScaleSenseGame: React.FC<ScaleSenseGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();

    const [gameState, setGameState] = useState<'start' | 'play' | 'result' | 'gameover'>('start');
    const [_round, setRound] = useState(1);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(60);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);

    // Level Data
    const [leftWeight, setLeftWeight] = useState(0);
    const [rightWeight, setRightWeight] = useState(0);
    const [_targetWeight, _setTargetWeight] = useState(0); // If mode is "Calculate missing"
    const [options, setOptions] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<'correct' | 'heavy' | 'light' | null>(null);

    // Visuals
    const [scaleTilt, setScaleTilt] = useState(0); // -10 (left heavy) to 10 (right heavy)

    const generateLevel = () => {
        // Generate random weights based on difficulty
        const count = difficulty === 'Easy' ? 2 : 3;

        const leftItems = Array(count).fill(0).map(() => Math.floor(Math.random() * 5) + 1);
        const totalLeft = leftItems.reduce((a, b) => a + b, 0);

        setLeftWeight(totalLeft);
        setRightWeight(0);

        // Options
        const correct = totalLeft;
        const opts = new Set<number>();
        opts.add(correct);
        while (opts.size < 4) {
            const v = correct + Math.floor(Math.random() * 6) - 3;
            if (v > 0 && v !== correct) opts.add(v);
        }
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    };

    const startGame = () => {
        setRound(1);
        setStars(0);
        setStreak(0);
        setMaxStreak(0);
        setTimer(60);
        setScoreSaved(false);
        generateLevel();
        setGameState('play');
    };

    const handleAnswer = (val: number) => {
        setRightWeight(val);

        // Animate tilt
        if (val > leftWeight) setScaleTilt(15);
        else if (val < leftWeight) setScaleTilt(-15);
        else setScaleTilt(0);

        if (val === leftWeight) {
            setFeedback('correct');
            setStars(s => s + 10 + streak);
            setStreak(s => {
                const n = s + 1;
                setMaxStreak(m => Math.max(m, n));
                return n;
            });
        } else if (val > leftWeight) {
            setFeedback('heavy');
            setStreak(0);
        } else {
            setFeedback('light');
            setStreak(0);
        }

        setGameState('result');
        setTimeout(() => {
            setFeedback(null);
            setRightWeight(0);
            setScaleTilt(0);
            setRound(r => r + 1);
            generateLevel();
            setGameState('play');
        }, 2000);
    };

    // Timer
    useEffect(() => {
        if (gameState === 'play') {
            const interval = setInterval(() => {
                setTimer(t => {
                    if (t <= 1) {
                        setGameState('gameover');
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [gameState]);

    const handleSaveScore = async () => {
        if (!playerName.trim()) return;
        await addLeaderboardEntry({
            game: 'scale-sense',
            name: playerName,
            stars,
            streak: maxStreak,
            date: new Date().toISOString()
        });
        setScoreSaved(true);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <SpaceBackground variant="skill">
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={formatTime} difficulty={difficulty} />

            <div className="flex flex-col items-center justify-center min-h-full pt-20 px-4">
                {gameState === 'start' && (
                    <div className="text-center">
                        <div className="text-7xl mb-4" style={{ animation: 'float 2s ease-in-out infinite' }}>⚖️</div>
                        <h1 className="text-4xl font-bold text-white mb-2">Scale Sense</h1>
                        <p className="text-amber-200 mb-4">Balance the scale!</p>
                        <button
                            onClick={startGame}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer"
                        >
                            START GAME
                        </button>
                    </div>
                )}

                {(gameState === 'play' || gameState === 'result') && (
                    <div className="flex flex-col items-center w-full max-w-2xl">
                        {/* Scale Visualization */}
                        <div className="relative w-full h-48 mb-12 flex justify-center items-end">
                            {/* Base */}
                            <div className="w-4 h-32 bg-gray-400 absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-lg shadow-lg"></div>

                            {/* Beam (Rotates) */}
                            <div
                                className="w-3/4 h-2 bg-gray-300 absolute top-16 transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                                style={{ transform: `rotate(${scaleTilt}deg)` }}
                            >
                                {/* Left Pan String */}
                                <div className="absolute left-0 top-0 w-[1px] h-20 bg-gray-400 origin-top" style={{ transform: `rotate(${-scaleTilt}deg)` }}>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-2 bg-amber-600 rounded-b-xl shadow-md flex justify-center items-end pb-[2px]">
                                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center font-bold text-white shadow-inner border-2 border-amber-400">
                                            {leftWeight}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Pan String */}
                                <div className="absolute right-0 top-0 w-[1px] h-20 bg-gray-400 origin-top" style={{ transform: `rotate(${-scaleTilt}deg)` }}>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-2 bg-amber-600 rounded-b-xl shadow-md flex justify-center items-end pb-[2px]">
                                        {rightWeight > 0 ? (
                                            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center font-bold text-white shadow-inner border-2 border-amber-400">
                                                {rightWeight}
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400">
                                                ?
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="text-white text-lg font-bold mb-4">Select the weight to balance:</div>
                        <div className="flex gap-4">
                            {options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(opt)}
                                    disabled={gameState === 'result'}
                                    className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-bold flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {feedback && (
                            <div className={`mt-8 text-2xl font-bold animate-bounce ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                {feedback === 'correct' ? 'Perfectly Balanced!' : feedback === 'heavy' ? 'Too Heavy!' : 'Too Light!'}
                            </div>
                        )}
                    </div>
                )}

                {gameState === 'gameover' && (
                    <GameOverScreen
                        stars={stars}
                        streak={maxStreak}
                        onRestart={startGame}
                        onBack={onBack}
                        onSaveScore={handleSaveScore}
                        playerName={playerName}
                        setPlayerName={setPlayerName}
                        scoreSaved={scoreSaved}
                    />
                )}
            </div>
        </SpaceBackground>
    );
};

export default ScaleSenseGame;
