import React, { useState, useEffect, useCallback } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';

interface SequenceSprintGameProps {
    onBack: () => void;
    difficulty: Difficulty;
}

const EMOJIS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '💎'];
const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const SequenceSprintGame: React.FC<SequenceSprintGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();
    const [currentItems, setCurrentItems] = useState<string[]>(difficulty === 'Hard' ? [...EMOJIS, ...NUMBERS.slice(0, 4)] : EMOJIS.slice(0, 6));
    const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>(difficulty === 'None' ? 'Easy' : difficulty);
    const [gameState, setGameState] = useState<'start' | 'show' | 'play' | 'result' | 'gameover'>('start');
    const [sequence, setSequence] = useState<string[]>([]);
    const [playerSequence, setPlayerSequence] = useState<string[]>([]);
    const [currentShowIndex, setCurrentShowIndex] = useState(0);
    const [round, setRound] = useState(1);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(90);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [attempted, setAttempted] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    const generateSequence = useCallback(() => {
        let effectiveDifficulty = difficulty;
        if (difficulty === 'None') {
            const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
            effectiveDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        }

        const len = effectiveDifficulty === 'Hard' ? 5 : effectiveDifficulty === 'Medium' ? 4 : 3;
        const pool = effectiveDifficulty === 'Hard' ? [...EMOJIS, ...NUMBERS.slice(0, 4)] : EMOJIS.slice(0, 6);
        const length = len + Math.floor(round / 3);
        const seq: string[] = [];
        for (let i = 0; i < length; i++) {
            seq.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        return { seq, pool, effectiveDifficulty };
    }, [difficulty, round]);

    const startRound = useCallback(() => {
        const { seq, pool, effectiveDifficulty } = generateSequence();
        setSequence(seq);
        setCurrentItems(pool);
        setActiveDifficulty(effectiveDifficulty);
        setPlayerSequence([]);
        setCurrentShowIndex(0);
        setFeedback(null);
        setGameState('show');
    }, [generateSequence]);

    useEffect(() => {
        if (gameState === 'show' && currentShowIndex < sequence.length) {
            const timerId = setTimeout(() => {
                setCurrentShowIndex(i => i + 1);
            }, 800);
            return () => clearTimeout(timerId);
        }
        if (gameState === 'show' && currentShowIndex >= sequence.length && sequence.length > 0) {
            const timerId = setTimeout(() => {
                setGameState('play');
                setCurrentShowIndex(-1);
            }, 500);
            return () => clearTimeout(timerId);
        }
    }, [gameState, currentShowIndex, sequence.length]);

    const startGame = () => {
        setRound(1);
        setStars(0);
        setStreak(0);
        setMaxStreak(0);
        setTimer(90);
        setScoreSaved(false);
        setAttempted(0);
        setCorrectCount(0);
        startRound();
    };

    const handleItemClick = (item: string) => {
        if (gameState !== 'play') return;

        const newPlayerSequence = [...playerSequence, item];
        setPlayerSequence(newPlayerSequence);
        const currentIndex = newPlayerSequence.length - 1;

        if (item !== sequence[currentIndex]) {
            setAttempted(value => value + 1);
            setFeedback('wrong');
            setStreak(0);
            setGameState('result');

            window.setTimeout(() => {
                setRound(r => r + 1);
                startRound();
            }, 2000);
            return;
        }

        if (newPlayerSequence.length === sequence.length) {
            setAttempted(value => value + 1);
            setCorrectCount(value => value + 1);
            const points = sequence.length * 5 * (activeDifficulty === 'Hard' ? 2 : activeDifficulty === 'Medium' ? 1.5 : 1);
            setStars(s => s + Math.floor(points + streak * 3));
            setStreak(s => {
                const newStreak = s + 1;
                setMaxStreak(m => Math.max(m, newStreak));
                return newStreak;
            });
            setFeedback('correct');
            setGameState('result');

            window.setTimeout(() => {
                setRound(r => r + 1);
                startRound();
            }, 1500);
        }
    };

    useEffect(() => {
        if (gameState === 'play' || gameState === 'show') {
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
            game: 'sequence-sprint',
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
                        <div className="text-7xl mb-4" style={{ animation: 'float 2s ease-in-out infinite' }}>🃏</div>
                        <h1 className="text-4xl font-bold text-white mb-2">Sequence Sprint</h1>
                        <p className="text-orange-200 mb-4">Remember and repeat the sequence!</p>
                        <div className="bg-orange-500/20 border border-orange-400/50 rounded-xl p-4 mb-6 max-w-sm">
                            <p className="text-white text-sm">
                                📋 <strong>How to play:</strong><br />
                                1. Watch the sequence of items<br />
                                2. Remember the order<br />
                                3. Tap the items in the same order!
                            </p>
                        </div>
                        <button
                            onClick={startGame}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer"
                        >
                            START GAME
                        </button>
                    </div>
                )}

                {(gameState === 'show' || gameState === 'play' || gameState === 'result') && (
                    <div className="text-center">
                        <div className="mb-4">
                            <span className={`text-lg font-bold px-4 py-2 rounded-full ${gameState === 'show' ? 'bg-yellow-500 text-black animate-pulse' :
                                feedback === 'correct' ? 'bg-green-500 text-white' :
                                    feedback === 'wrong' ? 'bg-red-500 text-white' :
                                        'bg-orange-500 text-white'
                                }`}>
                                {gameState === 'show' ? `👀 Watch carefully! · ${activeDifficulty}` :
                                    feedback === 'correct' ? '✓ Perfect!' :
                                        feedback === 'wrong' ? '✗ Wrong order!' :
                                            `Round ${round} - Repeat ${sequence.length} items`}
                            </span>
                        </div>

                        <div className="bg-gray-900/80 rounded-2xl p-6 mb-6 min-h-[100px] flex items-center justify-center gap-3 flex-wrap">
                            {gameState === 'show' ? (
                                <div className="text-6xl animate-bounce">
                                    {sequence[currentShowIndex] || '⏳'}
                                </div>
                            ) : gameState === 'result' ? (
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {sequence.map((item, i) => (
                                        <div
                                            key={i}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold border-2 ${playerSequence[i] === item
                                                ? 'bg-green-500/50 border-green-400'
                                                : 'bg-red-500/50 border-red-400'
                                                }`}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {playerSequence.map((item, i) => (
                                        <div
                                            key={i}
                                            className="w-12 h-12 rounded-xl bg-orange-500/50 border-2 border-orange-400 flex items-center justify-center text-2xl"
                                        >
                                            {item}
                                        </div>
                                    ))}
                                    {playerSequence.length < sequence.length && (
                                        <div className="w-12 h-12 rounded-xl bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-400">
                                            ?
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {gameState === 'play' && (
                            <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
                                {currentItems.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleItemClick(item)}
                                        className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-3xl font-bold hover:scale-110 transition-all cursor-pointer shadow-lg border-2 border-orange-300/50"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}

                        {gameState === 'play' && (
                            <p className="text-gray-300 mt-4">
                                Progress: {playerSequence.length} / {sequence.length}
                            </p>
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
                        gameTitle="Sequence Sprint"
                        skill="Memory & Concentration"
                        difficulty={difficulty === 'None' ? 'Mixed' : difficulty}
                        correct={correctCount}
                        attempted={attempted}
                        durationSeconds={90 - timer}
                        backLabel="BRAIN HUB"
                    />
                )}
            </div>
        </SpaceBackground>
    );
};

export default SequenceSprintGame;
