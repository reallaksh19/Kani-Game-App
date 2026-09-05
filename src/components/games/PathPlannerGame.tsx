import React, { useState, useEffect } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';

interface PathPlannerGameProps {
    onBack: () => void;
    difficulty: Difficulty;
}

type Cell = 'empty' | 'robot' | 'goal' | 'obstacle' | 'star' | 'visited';
type Direction = '⬆️' | '➡️' | '⬇️' | '⬅️';

const DIRECTIONS: Direction[] = ['⬆️', '➡️', '⬇️', '⬅️'];

export const PathPlannerGame: React.FC<PathPlannerGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();

    const [currentGridSize, setCurrentGridSize] = useState(difficulty === 'Hard' ? 5 : difficulty === 'Medium' ? 4 : 3);
    const [currentMaxMoves, setCurrentMaxMoves] = useState(difficulty === 'Hard' ? 10 : difficulty === 'Medium' ? 8 : 6);

    const [gameState, setGameState] = useState<'start' | 'planning' | 'running' | 'result' | 'gameover'>('start');
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [robotPos, setRobotPos] = useState({ x: 0, y: 0 });
    const [goalPos, setGoalPos] = useState({ x: 0, y: 0 });
    const [commands, setCommands] = useState<Direction[]>([]);
    const [currentCommandIndex, setCurrentCommandIndex] = useState(-1);
    const [round, setRound] = useState(1);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(120);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);
    const [starsCollected, setStarsCollected] = useState(0);
    const [feedback, setFeedback] = useState<'success' | 'fail' | null>(null);

    // Generate level
    const generateLevel = () => {
        let effectiveDifficulty = difficulty;
        if (difficulty === 'None') {
            const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
            effectiveDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        }

        const gSize = effectiveDifficulty === 'Hard' ? 5 : effectiveDifficulty === 'Medium' ? 4 : 3;
        const mMoves = effectiveDifficulty === 'Hard' ? 10 : effectiveDifficulty === 'Medium' ? 8 : 6;

        setCurrentGridSize(gSize);
        setCurrentMaxMoves(mMoves);

        const newGrid: Cell[][] = Array(gSize).fill(null).map(() =>
            Array(gSize).fill('empty')
        );

        // Place robot (bottom-left area)
        const startX = Math.floor(Math.random() * 2);
        const startY = gSize - 1 - Math.floor(Math.random() * 2);
        newGrid[startY][startX] = 'robot';

        // Place goal (top-right area)
        const goalX = gSize - 1 - Math.floor(Math.random() * 2);
        const goalY = Math.floor(Math.random() * 2);
        newGrid[goalY][goalX] = 'goal';

        // Add obstacles based on difficulty
        const obstacleCount = effectiveDifficulty === 'Hard' ? 4 : effectiveDifficulty === 'Medium' ? 2 : 1;
        let placed = 0;
        while (placed < obstacleCount) {
            const x = Math.floor(Math.random() * gSize);
            const y = Math.floor(Math.random() * gSize);
            if (newGrid[y][x] === 'empty') {
                newGrid[y][x] = 'obstacle';
                placed++;
            }
        }

        // Add stars to collect (Medium/Hard)
        if (effectiveDifficulty !== 'Easy') {
            const starCount = effectiveDifficulty === 'Hard' ? 2 : 1;
            let starsPlaced = 0;
            while (starsPlaced < starCount) {
                const x = Math.floor(Math.random() * gSize);
                const y = Math.floor(Math.random() * gSize);
                if (newGrid[y][x] === 'empty') {
                    newGrid[y][x] = 'star';
                    starsPlaced++;
                }
            }
        }

        setGrid(newGrid);
        setRobotPos({ x: startX, y: startY });
        setGoalPos({ x: goalX, y: goalY });
        setCommands([]);
        setCurrentCommandIndex(-1);
        setStarsCollected(0);
        setFeedback(null);
    };

    // Start round
    const startRound = () => {
        generateLevel();
        setGameState('planning');
    };

    // Start game
    const startGame = () => {
        setRound(1);
        setStars(0);
        setStreak(0);
        setMaxStreak(0);
        setTimer(120);
        setScoreSaved(false);
        startRound();
    };

    // Add command
    const addCommand = (dir: Direction) => {
        if (commands.length < currentMaxMoves) {
            setCommands([...commands, dir]);
        }
    };

    // Remove last command
    const removeCommand = () => {
        setCommands(commands.slice(0, -1));
    };

    // Clear commands
    const clearCommands = () => {
        setCommands([]);
    };

    // Run commands
    const runCommands = () => {
        if (commands.length === 0) return;
        setGameState('running');
        setCurrentCommandIndex(0);
    };

    // Execute commands animation
    useEffect(() => {
        if (gameState !== 'running' || currentCommandIndex < 0) return;

        if (currentCommandIndex >= commands.length) {
            // Finished executing
            const success = robotPos.x === goalPos.x && robotPos.y === goalPos.y;

            if (success) {
                const bonusPoints = starsCollected * 10;
                const moveBonus = Math.max(0, (currentMaxMoves - commands.length) * 5);
                const points = 20 + bonusPoints + moveBonus;
                setStars(s => s + Math.floor(points * (difficulty === 'Hard' ? 2 : difficulty === 'Medium' ? 1.5 : 1)));
                setStreak(s => {
                    const newStreak = s + 1;
                    setMaxStreak(m => Math.max(m, newStreak));
                    return newStreak;
                });
                setFeedback('success');
            } else {
                setStreak(0);
                setFeedback('fail');
            }

            setGameState('result');
            setTimeout(() => {
                setRound(r => r + 1);
                startRound();
            }, 2000);
            return;
        }

        const timer = setTimeout(() => {
            const dir = commands[currentCommandIndex];
            let newX = robotPos.x;
            let newY = robotPos.y;

            switch (dir) {
                case '⬆️': newY = Math.max(0, robotPos.y - 1); break;
                case '⬇️': newY = Math.min(currentGridSize - 1, robotPos.y + 1); break;
                case '⬅️': newX = Math.max(0, robotPos.x - 1); break;
                case '➡️': newX = Math.min(currentGridSize - 1, robotPos.x + 1); break;
            }

            // Check for obstacle
            if (grid[newY][newX] === 'obstacle') {
                // Hit obstacle - fail
                setStreak(0);
                setFeedback('fail');
                setGameState('result');
                setTimeout(() => {
                    setRound(r => r + 1);
                    startRound();
                }, 2000);
                return;
            }

            // Check for star
            if (grid[newY][newX] === 'star') {
                setStarsCollected(s => s + 1);
                setGrid(g => {
                    const newGrid = g.map(row => [...row]);
                    newGrid[newY][newX] = 'visited';
                    return newGrid;
                });
            }

            // Update robot position
            setGrid(g => {
                const newGrid = g.map(row => [...row]);
                newGrid[robotPos.y][robotPos.x] = 'visited';
                newGrid[newY][newX] = newGrid[newY][newX] === 'goal' ? 'goal' : 'robot';
                return newGrid;
            });

            setRobotPos({ x: newX, y: newY });
            setCurrentCommandIndex(i => i + 1);
        }, 500);

        return () => clearTimeout(timer);
    }, [gameState, currentCommandIndex, commands, robotPos, goalPos, grid, difficulty, currentMaxMoves, currentGridSize, starsCollected]);

    // Timer countdown
    useEffect(() => {
        if (gameState === 'planning') {
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
            game: 'path-planner',
            name: playerName,
            stars,
            streak: maxStreak,
            date: new Date().toISOString()
        });
        setScoreSaved(true);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const getCellContent = (cell: Cell, x: number, y: number) => {
        if (robotPos.x === x && robotPos.y === y && gameState !== 'start') return '🤖';
        switch (cell) {
            case 'goal': return '🏁';
            case 'obstacle': return '🪨';
            case 'star': return '⭐';
            case 'visited': return '·';
            default: return '';
        }
    };

    const getCellStyle = (cell: Cell, x: number, y: number) => {
        if (robotPos.x === x && robotPos.y === y) return 'bg-blue-500/50 border-blue-400';
        switch (cell) {
            case 'goal': return 'bg-green-500/30 border-green-400';
            case 'obstacle': return 'bg-red-500/30 border-red-400';
            case 'star': return 'bg-yellow-500/30 border-yellow-400';
            case 'visited': return 'bg-gray-600/50 border-gray-500';
            default: return 'bg-gray-700/50 border-gray-600';
        }
    };

    return (
        <SpaceBackground variant="skill">
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={formatTime} difficulty={difficulty} />

            <div className="flex flex-col items-center justify-center min-h-full pt-20 px-4">
                {gameState === 'start' && (
                    <div className="text-center">
                        <div className="text-7xl mb-4" style={{ animation: 'float 2s ease-in-out infinite' }}>🤖</div>
                        <h1 className="text-4xl font-bold text-white mb-2">Path Planner</h1>
                        <p className="text-green-200 mb-4">Program the robot to reach the goal!</p>
                        <div className="bg-green-500/20 border border-green-400/50 rounded-xl p-4 mb-6 max-w-sm">
                            <p className="text-white text-sm">
                                📋 <strong>How to play:</strong><br />
                                1. Plan your moves in advance<br />
                                2. Avoid 🪨 obstacles<br />
                                3. Collect ⭐ stars for bonus points<br />
                                4. Reach the 🏁 goal!
                            </p>
                        </div>
                        <button
                            onClick={startGame}
                            className="bg-gradient-to-r from-green-500 to-lime-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer"
                        >
                            START GAME
                        </button>
                    </div>
                )}

                {(gameState === 'planning' || gameState === 'running' || gameState === 'result') && (
                    <div className="text-center">
                        <div className="mb-4">
                            <span className={`text-lg font-bold px-4 py-2 rounded-full ${gameState === 'running' ? 'bg-blue-500 text-white animate-pulse' :
                                feedback === 'success' ? 'bg-green-500 text-white' :
                                    feedback === 'fail' ? 'bg-red-500 text-white' :
                                        'bg-green-500 text-white'
                                }`}>
                                {gameState === 'running' ? '🤖 Executing...' :
                                    feedback === 'success' ? '✓ Goal reached!' :
                                        feedback === 'fail' ? '✗ Path blocked!' :
                                            `Round ${round} - Plan your path!`}
                            </span>
                        </div>

                        {/* Grid */}
                        <div
                            className="grid gap-1 mx-auto mb-4"
                            style={{
                                gridTemplateColumns: `repeat(${currentGridSize}, 1fr)`,
                                width: `${currentGridSize * 50 + (currentGridSize - 1) * 4}px`
                            }}
                        >
                            {grid.map((row, y) =>
                                row.map((cell, x) => (
                                    <div
                                        key={`${x}-${y}`}
                                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${getCellStyle(cell, x, y)}`}
                                    >
                                        {getCellContent(cell, x, y)}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Commands display */}
                        <div className="bg-gray-900/80 rounded-xl p-3 mb-4 min-h-[60px] flex items-center justify-center gap-2 flex-wrap">
                            {commands.length === 0 ? (
                                <span className="text-gray-400">Add commands below...</span>
                            ) : (
                                commands.map((cmd, i) => (
                                    <div
                                        key={i}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${currentCommandIndex === i ? 'bg-blue-500 border-2 border-blue-300 animate-pulse' : 'bg-gray-700 border border-gray-600'
                                            }`}
                                    >
                                        {cmd}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Control buttons */}
                        {gameState === 'planning' && (
                            <>
                                <div className="flex justify-center gap-2 mb-4">
                                    {DIRECTIONS.map(dir => (
                                        <button
                                            key={dir}
                                            onClick={() => addCommand(dir)}
                                            disabled={commands.length >= currentMaxMoves}
                                            className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-lime-500 text-2xl font-bold hover:scale-110 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {dir}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-center gap-3">
                                    <button
                                        onClick={removeCommand}
                                        disabled={commands.length === 0}
                                        className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-500 cursor-pointer disabled:opacity-50"
                                    >
                                        ↩️ Undo
                                    </button>
                                    <button
                                        onClick={clearCommands}
                                        disabled={commands.length === 0}
                                        className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-500 cursor-pointer disabled:opacity-50"
                                    >
                                        🗑️ Clear
                                    </button>
                                    <button
                                        onClick={runCommands}
                                        disabled={commands.length === 0}
                                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:scale-105 cursor-pointer disabled:opacity-50"
                                    >
                                        ▶️ Run
                                    </button>
                                </div>

                                <p className="text-gray-400 mt-3">
                                    Moves: {commands.length} / {currentMaxMoves} | Stars: {starsCollected}
                                </p>
                            </>
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

export default PathPlannerGame;
