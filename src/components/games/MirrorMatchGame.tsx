import React, { useState, useEffect } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';

interface MirrorMatchGameProps {
    onBack: () => void;
    difficulty: Difficulty;
}

export const MirrorMatchGame: React.FC<MirrorMatchGameProps> = ({ onBack, difficulty }) => {
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
    const [pattern, setPattern] = useState<number[]>([]); // 3x3 grid
    const [options, setOptions] = useState<number[][]>([]); // 4 options
    const [correctIndex, setCorrectIndex] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    const generateLevel = () => {
        // Create random 3x3 pattern (9 cells)
        const newPattern = Array(9).fill(0).map(() => Math.random() > 0.5 ? 1 : 0);
        setPattern(newPattern);

        // Generate Correct Reflection (Horizontal Flip)
        // 0 1 2 -> 2 1 0
        // 3 4 5 -> 5 4 3
        // 6 7 8 -> 8 7 6
        const reflect = (p: number[]) => {
            const r = [...p];
            // Row 1
            [r[0], r[2]] = [r[2], r[0]];
            // Row 2
            [r[3], r[5]] = [r[5], r[3]];
            // Row 3
            [r[6], r[8]] = [r[8], r[6]];
            return r;
        }

        const correct = reflect(newPattern);

        // Generate distractor options
        const opts = [correct];
        while (opts.length < 4) {
            // Random mutations
            const base = Math.random() > 0.5 ? [...correct] : [...newPattern];
            const mutationIdx = Math.floor(Math.random() * 9);
            base[mutationIdx] = base[mutationIdx] === 1 ? 0 : 1;
            opts.push(base);
        }

        // Shuffle options
        const shuffled = opts.map((val, idx) => ({ val, idx })).sort(() => Math.random() - 0.5);

        setOptions(shuffled.map(o => o.val));
        setCorrectIndex(shuffled.findIndex(o => JSON.stringify(o.val) === JSON.stringify(correct)));
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

    const handleAnswer = (index: number) => {
        if (index === correctIndex) {
            setFeedback('correct');
            setStars(s => s + 10 + streak);
            setStreak(s => {
                const n = s + 1;
                setMaxStreak(m => Math.max(m, n));
                return n;
            });
        } else {
            setFeedback('wrong');
            setStreak(0);
        }

        setGameState('result');
        setTimeout(() => {
            setFeedback(null);
            setRound(r => r + 1);
            generateLevel();
            setGameState('play');
        }, 1500);
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
            game: 'mirror-match',
            name: playerName,
            stars,
            streak: maxStreak,
            date: new Date().toISOString()
        });
        setScoreSaved(true);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const renderGrid = (grid: number[], size: 'lg' | 'sm' = 'sm', onClick?: () => void) => (
        <div
            onClick={onClick}
            className={`grid grid-cols-3 gap-1 bg-gray-800 p-2 rounded-lg border-2 border-gray-600 ${onClick ? 'cursor-pointer hover:border-teal-400 transition-colors' : ''}`}
            style={{ width: size === 'lg' ? '120px' : '80px', height: size === 'lg' ? '120px' : '80px' }}
        >
            {grid.map((cell, i) => (
                <div key={i} className={`rounded-sm ${cell === 1 ? 'bg-teal-400' : 'bg-gray-700'}`} />
            ))}
        </div>
    );

    return (
        <SpaceBackground variant="skill">
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={formatTime} difficulty={difficulty} />

            <div className="flex flex-col items-center justify-center min-h-full pt-20 px-4">
                {gameState === 'start' && (
                    <div className="text-center">
                        <div className="text-7xl mb-4" style={{ animation: 'float 2s ease-in-out infinite' }}>🪞</div>
                        <h1 className="text-4xl font-bold text-white mb-2">Mirror Match</h1>
                        <p className="text-teal-200 mb-4">Find the correct reflection!</p>
                        <button
                            onClick={startGame}
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer"
                        >
                            START GAME
                        </button>
                    </div>
                )}

                {(gameState === 'play' || gameState === 'result') && (
                    <div className="flex flex-col items-center w-full max-w-2xl">
                        <div className="flex items-center gap-8 mb-8">
                            <div className="flex flex-col items-center">
                                <span className="text-white mb-2 font-bold">PATTERN</span>
                                {renderGrid(pattern, 'lg')}
                            </div>
                            <div className="h-32 w-1 bg-gradient-to-b from-transparent via-white to-transparent opacity-50 mx-4"></div>
                            <div className="flex flex-col items-center">
                                <span className="text-white mb-2 font-bold">MIRROR</span>
                                <div className="w-[120px] h-[120px] border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center text-4xl">
                                    ?
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {options.map((opt, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    {renderGrid(opt, 'sm', () => gameState === 'play' && handleAnswer(i))}
                                    {gameState === 'result' && (
                                        <span className={`text-2xl ${i === correctIndex ? 'text-green-500' : 'text-transparent'}`}>
                                            {i === correctIndex ? '✓' : '✗'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {feedback && (
                            <div className={`mt-8 text-2xl font-bold animate-bounce ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                {feedback === 'correct' ? 'Reflected!' : 'Broken Mirror!'}
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

export default MirrorMatchGame;
