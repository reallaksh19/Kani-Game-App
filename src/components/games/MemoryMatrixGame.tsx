import React, { useState, useEffect, useCallback } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';

interface MemoryMatrixGameProps {
    onBack: () => void;
    difficulty: Difficulty;
}

export const MemoryMatrixGame: React.FC<MemoryMatrixGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();

    // Grid size based on difficulty
    // Grid size state
    const [currentGridSize, setCurrentGridSize] = useState(difficulty === 'Hard' ? 5 : difficulty === 'Medium' ? 4 : 3);


    const [gameState, setGameState] = useState<'start' | 'show' | 'play' | 'result' | 'gameover'>('start');
    const [highlightedCells, setHighlightedCells] = useState<number[]>([]);
    const [selectedCells, setSelectedCells] = useState<number[]>([]);
    const [round, setRound] = useState(1);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [showTime, setShowTime] = useState(3000);
    const [timer, setTimer] = useState(60);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);

    // Generate random cells to highlight
    const generatePattern = useCallback(() => {
        // Determine difficulty for this round
        let currentDifficulty = difficulty;
        if (difficulty === 'None') {
            const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
            currentDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        }

        const currentGridSize = currentDifficulty === 'Hard' ? 5 : currentDifficulty === 'Medium' ? 4 : 3;
        const currentCellsToRemember = currentDifficulty === 'Hard' ? 7 : currentDifficulty === 'Medium' ? 5 : 3;

        // Update grid size visual needs to be handled in render, but for now we rely on pattern generation
        // Actually, render uses 'gridSize' constant. We need state for these if they change!
        // For 'None' support, we must refactor to state.

        const cells: number[] = [];
        const totalCells = currentGridSize * currentGridSize;
        const count = Math.min(currentCellsToRemember + Math.floor(round / 2), totalCells - 1);

        while (cells.length < count) {
            const cell = Math.floor(Math.random() * totalCells);
            if (!cells.includes(cell)) cells.push(cell);
        }
        return { cells, gridSize: currentGridSize };
    }, [difficulty, round]);

    // Start a new round
    const startRound = useCallback(() => {
        const { cells, gridSize } = generatePattern();
        setHighlightedCells(cells);
        setCurrentGridSize(gridSize);
        setSelectedCells([]);
        setGameState('show');

        // Hide pattern after showTime
        setTimeout(() => {
            setGameState('play');
        }, showTime);
    }, [generatePattern, showTime]);

    // Start game
    const startGame = () => {
        setRound(1);
        setStars(0);
        setStreak(0);
        setMaxStreak(0);
        setTimer(60);
        setScoreSaved(false);
        setShowTime(3000);
        startRound();
    };

    // Handle cell click
    const handleCellClick = (index: number) => {
        if (gameState !== 'play') return;
        if (selectedCells.includes(index)) return;

        const newSelected = [...selectedCells, index];
        setSelectedCells(newSelected);

        // Check if all cells selected
        if (newSelected.length === highlightedCells.length) {
            checkAnswer(newSelected);
        }
    };

    // Check answer
    const checkAnswer = (selected: number[]) => {
        const correct = selected.every(cell => highlightedCells.includes(cell));

        if (correct) {
            const points = 10 * (difficulty === 'Hard' ? 2 : difficulty === 'Medium' ? 1.5 : 1);
            setStars(s => s + Math.floor(points + streak * 2));
            setStreak(s => {
                const newStreak = s + 1;
                setMaxStreak(m => Math.max(m, newStreak));
                return newStreak;
            });
            setGameState('result');

            // Next round
            setTimeout(() => {
                setRound(r => r + 1);
                setShowTime(t => Math.max(1500, t - 200)); // Decrease show time
                startRound();
            }, 1500);
        } else {
            setStreak(0);
            setGameState('result');

            setTimeout(() => {
                setRound(r => r + 1);
                startRound();
            }, 2000);
        }
    };

    // Timer countdown
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

    // Save score
    const handleSaveScore = async () => {
        if (!playerName.trim()) return;
        await addLeaderboardEntry({
            game: 'memory-matrix',
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
                        <div className="text-7xl mb-4" style={{ animation: 'float 2s ease-in-out infinite' }}>🧠</div>
                        <h1 className="text-4xl font-bold text-white mb-2">Memory Matrix</h1>
                        <p className="text-pink-200 mb-4">Remember the highlighted cells!</p>
                        <div className="bg-pink-500/20 border border-pink-400/50 rounded-xl p-4 mb-6 max-w-sm">
                            <p className="text-white text-sm">
                                📋 <strong>How to play:</strong><br />
                                1. Watch the pattern light up<br />
                                2. Remember which cells were highlighted<br />
                                3. Click the same cells from memory!
                            </p>
                        </div>
                        <button
                            onClick={startGame}
                            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer"
                        >
                            START GAME
                        </button>
                    </div>
                )}

                {(gameState === 'show' || gameState === 'play' || gameState === 'result') && (
                    <div className="text-center">
                        <div className="mb-4">
                            <span className={`text-lg font-bold px-4 py-2 rounded-full ${gameState === 'show' ? 'bg-yellow-500 text-black animate-pulse' :
                                gameState === 'result' ? (selectedCells.every(c => highlightedCells.includes(c)) ? 'bg-green-500 text-white' : 'bg-red-500 text-white') :
                                    'bg-pink-500 text-white'
                                }`}>
                                {gameState === 'show' ? '👀 Memorize!' :
                                    gameState === 'result' ? (selectedCells.every(c => highlightedCells.includes(c)) ? '✓ Correct!' : '✗ Try again!') :
                                        `Round ${round} - Select ${highlightedCells.length} cells`}
                            </span>
                        </div>

                        {/* Grid */}
                        <div
                            className="grid gap-2 mx-auto mb-6"
                            style={{
                                gridTemplateColumns: `repeat(${currentGridSize}, 1fr)`,
                                width: `${currentGridSize * 60 + (currentGridSize - 1) * 8}px`
                            }}
                        >
                            {Array.from({ length: currentGridSize * currentGridSize }).map((_, index) => {
                                const isHighlighted = highlightedCells.includes(index);
                                const isSelected = selectedCells.includes(index);
                                const showHighlight = gameState === 'show' || gameState === 'result';

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleCellClick(index)}
                                        disabled={gameState !== 'play'}
                                        className={`
                                            w-14 h-14 rounded-xl transition-all duration-200 cursor-pointer
                                            ${showHighlight && isHighlighted
                                                ? 'bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-pink-300 shadow-lg shadow-pink-500/50'
                                                : isSelected
                                                    ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-300'
                                                    : 'bg-gray-700/80 border-2 border-gray-600 hover:bg-gray-600'
                                            }
                                            ${gameState === 'result' && isSelected && !isHighlighted ? 'bg-red-500 border-red-400' : ''}
                                        `}
                                    />
                                );
                            })}
                        </div>

                        {gameState === 'play' && (
                            <p className="text-gray-300">
                                Selected: {selectedCells.length} / {highlightedCells.length}
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
                    />
                )}
            </div>
        </SpaceBackground>
    );
};

export default MemoryMatrixGame;
