import React, { useState, useEffect } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';

interface VennVoyagerGameProps {
    onBack: () => void;
    difficulty: Difficulty;
}

interface Item {
    id: string;
    emoji: string;
    label: string;
    traits: string[]; // e.g., ['red', 'fruit']
}

export const VennVoyagerGame: React.FC<VennVoyagerGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();

    const [gameState, setGameState] = useState<'start' | 'play' | 'result' | 'gameover'>('start');
    const [, setRound] = useState(1);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(60);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);

    // Level State
    const [setA, setSetA] = useState('');
    const [setB, setSetB] = useState('');
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [sortedCount, setSortedCount] = useState(0);
    const [targetCount] = useState(5);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    // Data
    const itemsPool: Item[] = [
        { id: 'apple', emoji: '🍎', label: 'Apple', traits: ['red', 'fruit', 'round', 'food'] },
        { id: 'banana', emoji: '🍌', label: 'Banana', traits: ['yellow', 'fruit', 'long', 'food'] },
        { id: 'grape', emoji: '🍇', label: 'Grape', traits: ['purple', 'fruit', 'round', 'food'] },
        { id: 'carrot', emoji: '🥕', label: 'Carrot', traits: ['orange', 'vegetable', 'long', 'food'] },
        { id: 'ball', emoji: '⚽', label: 'Ball', traits: ['white', 'toy', 'round', 'sport'] },
        { id: 'fire', emoji: '🔥', label: 'Fire', traits: ['red', 'hot', 'danger'] },
        { id: 'sun', emoji: '☀️', label: 'Sun', traits: ['yellow', 'hot', 'round', 'nature'] },
        { id: 'frog', emoji: '🐸', label: 'Frog', traits: ['green', 'animal', 'jump'] },
        { id: 'bird', emoji: '🐦', label: 'Bird', traits: ['blue', 'animal', 'fly'] },
        { id: 'plane', emoji: '✈️', label: 'Plane', traits: ['white', 'vehicle', 'fly'] },
        { id: 'car', emoji: '🚗', label: 'Car', traits: ['red', 'vehicle', 'drive'] },
        { id: 'cookie', emoji: '🍪', label: 'Cookie', traits: ['brown', 'food', 'round'] },
    ];

    const generateLevel = () => {
        // Pick two categories

        // Randomly assign A and B
        // Hardcode some good overlapping pairs
        const pairs = [
            { A: 'red', B: 'fruit' },
            { A: 'round', B: 'food' },
            { A: 'animal', B: 'green' },
            { A: 'hot', B: 'yellow' }
        ];

        const selectedPair = pairs[Math.floor(Math.random() * pairs.length)];
        setSetA(selectedPair.A);
        setSetB(selectedPair.B);

        nextItem();
    };

    const nextItem = () => {
        const item = itemsPool[Math.floor(Math.random() * itemsPool.length)];
        setCurrentItem(item);
    };

    const startGame = () => {
        setRound(1);
        setStars(0);
        setStreak(0);
        setMaxStreak(0);
        setTimer(60);
        setScoreSaved(false);
        setSortedCount(0);
        generateLevel();
        setGameState('play');
    };

    const checkSort = (zone: 'A' | 'B' | 'Both' | 'None') => {
        if (!currentItem) return;

        const hasA = currentItem.traits.includes(setA);
        const hasB = currentItem.traits.includes(setB);

        let correctZone = 'None';
        if (hasA && hasB) correctZone = 'Both';
        else if (hasA) correctZone = 'A';
        else if (hasB) correctZone = 'B';

        if (zone === correctZone) {
            setFeedback('correct');
            setStars(s => s + 10 + streak);
            setStreak(s => {
                const n = s + 1;
                setMaxStreak(m => Math.max(m, n));
                return n;
            });
            setSortedCount(c => c + 1);
        } else {
            setFeedback('wrong');
            setStreak(0);
        }

        setTimeout(() => {
            setFeedback(null);
            if (sortedCount >= targetCount) {
                setRound(r => r + 1);
                setSortedCount(0);
                generateLevel();
            } else {
                nextItem();
            }
        }, 1000);
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
            game: 'venn-voyager',
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
                        <div className="text-7xl mb-4" style={{ animation: 'float 2s ease-in-out infinite' }}>⭕</div>
                        <h1 className="text-4xl font-bold text-white mb-2">Venn Voyager</h1>
                        <p className="text-pink-200 mb-4">Sort the items into the correct circles!</p>
                        <button
                            onClick={startGame}
                            className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer"
                        >
                            START GAME
                        </button>
                    </div>
                )}

                {gameState === 'play' && currentItem && (
                    <div className="w-full max-w-2xl text-center">
                        <div className="mb-4">
                            <div className="text-6xl animate-bounce mb-2">{currentItem.emoji}</div>
                            <div className="text-2xl font-bold text-white">{currentItem.label}</div>
                            {feedback && (
                                <div className={`text-xl font-bold ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                    {feedback === 'correct' ? 'Nice work!' : 'Try again!'}
                                </div>
                            )}
                        </div>

                        {/* Venn Diagram Visual / Click Zones */}
                        <div className="relative h-64 w-full max-w-lg mx-auto mb-8">
                            {/* Circle A */}
                            <button
                                onClick={() => checkSort('A')}
                                className="absolute left-0 top-0 w-40 h-40 rounded-full bg-red-500/30 border-2 border-red-400 flex items-center justify-center hover:bg-red-500/50 transition-colors z-10"
                                style={{ transform: 'translateX(20%)' }}
                            >
                                <span className="font-bold text-white drop-shadow-md -translate-x-4 -translate-y-10">{setA.toUpperCase()}</span>
                            </button>

                            {/* Circle B */}
                            <button
                                onClick={() => checkSort('B')}
                                className="absolute right-0 top-0 w-40 h-40 rounded-full bg-blue-500/30 border-2 border-blue-400 flex items-center justify-center hover:bg-blue-500/50 transition-colors z-10"
                                style={{ transform: 'translateX(-20%)' }}
                            >
                                <span className="font-bold text-white drop-shadow-md translate-x-4 -translate-y-10">{setB.toUpperCase()}</span>
                            </button>

                            {/* Intersection */}
                            <button
                                onClick={() => checkSort('Both')}
                                className="absolute left-1/2 top-0 w-24 h-40 -translate-x-1/2 rounded-full cursor-pointer z-20 flex items-center justify-center hover:bg-purple-500/20"
                            >
                                <span className="text-sm font-bold text-white mt-10">BOTH</span>
                            </button>

                            {/* Outside */}
                            <button
                                onClick={() => checkSort('None')}
                                className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-gray-700/50 border border-gray-500 px-6 py-2 rounded-full hover:bg-gray-600/50 text-white"
                            >
                                NEITHER
                            </button>
                        </div>
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

export default VennVoyagerGame;
