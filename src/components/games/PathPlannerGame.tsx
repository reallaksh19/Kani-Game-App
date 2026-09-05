import React, { useEffect, useMemo, useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';
import { Coord, coordKey, generatePathLevel, PathLevel } from '../../utils/brainGameGenerators';

interface PathPlannerGameProps { onBack: () => void; difficulty: Difficulty; }
type Direction = '⬆️' | '➡️' | '⬇️' | '⬅️';
const DIRECTIONS: Direction[] = ['⬆️', '➡️', '⬇️', '⬅️'];
const DELTA: Record<Direction, [number, number]> = { '⬆️': [0, -1], '➡️': [1, 0], '⬇️': [0, 1], '⬅️': [-1, 0] };

export const PathPlannerGame: React.FC<PathPlannerGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();
    const [gameState, setGameState] = useState<'start' | 'planning' | 'result' | 'gameover'>('start');
    const [level, setLevel] = useState<PathLevel | null>(null);
    const [commands, setCommands] = useState<Direction[]>([]);
    const [robotPos, setRobotPos] = useState<Coord>({ x: 0, y: 0 });
    const [visited, setVisited] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<'success' | 'fail' | null>(null);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(120);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);

    const obstacleSet = useMemo(() => new Set(level?.obstacles ?? []), [level]);
    const starSet = useMemo(() => new Set(level?.stars ?? []), [level]);

    const nextRound = () => {
        const next = generatePathLevel(difficulty);
        setLevel(next);
        setCommands([]);
        setRobotPos(next.start);
        setVisited([coordKey(next.start)]);
        setFeedback(null);
        setGameState('planning');
    };

    const startGame = () => {
        setStars(0); setStreak(0); setMaxStreak(0); setTimer(120); setScoreSaved(false);
        nextRound();
    };

    const runCommands = () => {
        if (!level || commands.length === 0 || gameState !== 'planning') return;
        let pos = { ...level.start };
        const path = [coordKey(pos)];
        let failed = false;
        for (const command of commands) {
            const [dx, dy] = DELTA[command];
            const next = { x: pos.x + dx, y: pos.y + dy };
            if (next.x < 0 || next.y < 0 || next.x >= level.size || next.y >= level.size || obstacleSet.has(coordKey(next))) {
                failed = true;
                break;
            }
            pos = next;
            path.push(coordKey(pos));
        }
        setRobotPos(pos);
        setVisited(path);
        const success = !failed && pos.x === level.goal.x && pos.y === level.goal.y;
        setFeedback(success ? 'success' : 'fail');
        if (success) {
            const collected = level.stars.filter(star => path.includes(star)).length;
            const efficiency = Math.max(0, level.maxMoves - commands.length);
            const multiplier = level.difficulty === 'Hard' ? 2 : level.difficulty === 'Medium' ? 1.5 : 1;
            setStars(s => s + Math.floor((20 + collected * 10 + efficiency * 3) * multiplier));
            setStreak(s => { const n = s + 1; setMaxStreak(m => Math.max(m, n)); return n; });
        } else {
            setStreak(0);
        }
        setGameState('result');
        window.setTimeout(nextRound, 2200);
    };

    useEffect(() => {
        if (gameState !== 'planning' && gameState !== 'result') return;
        const id = window.setInterval(() => setTimer(t => {
            if (t <= 1) { setGameState('gameover'); return 0; }
            return t - 1;
        }), 1000);
        return () => window.clearInterval(id);
    }, [gameState]);

    const handleSaveScore = async () => {
        if (!playerName.trim()) return;
        await addLeaderboardEntry({ game: 'path-planner', name: playerName, stars, streak: maxStreak, date: new Date().toISOString() });
        setScoreSaved(true);
    };
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <SpaceBackground variant="skill">
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={formatTime} difficulty={difficulty} />
            <div className="flex min-h-full items-center justify-center px-4 pt-20">
                {gameState === 'start' && (
                    <div className="max-w-lg text-center">
                        <div className="text-7xl mb-4">🤖</div><h1 className="text-4xl font-bold text-white mb-2">Path Planner</h1>
                        <p className="text-cyan-200 mb-4">Program the robot to reach the goal. Every generated board is checked for a valid route before play.</p>
                        <button onClick={startGame} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform">START GAME</button>
                    </div>
                )}

                {(gameState === 'planning' || gameState === 'result') && level && (
                    <div className="w-full max-w-3xl text-center">
                        <div className="mb-4 flex flex-wrap justify-center gap-2 text-sm font-bold">
                            <span className="rounded-full bg-white/10 px-3 py-1 text-white">{level.difficulty}</span>
                            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-cyan-100">Shortest route: {level.shortestPathLength}</span>
                            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-100">Move budget: {commands.length}/{level.maxMoves}</span>
                        </div>
                        <div className="grid gap-2 mx-auto mb-6 rounded-2xl bg-black/20 p-3" style={{ gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))`, width: `${level.size * 56 + 24}px` }}>
                            {Array.from({ length: level.size * level.size }, (_, index) => {
                                const x = index % level.size; const y = Math.floor(index / level.size); const key = `${x},${y}`;
                                const isRobot = robotPos.x === x && robotPos.y === y;
                                const isGoal = level.goal.x === x && level.goal.y === y;
                                const isObstacle = obstacleSet.has(key); const isStar = starSet.has(key); const wasVisited = visited.includes(key);
                                return <div key={key} className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl ${isObstacle ? 'bg-slate-700 border-slate-500' : wasVisited ? 'bg-cyan-500/30 border-cyan-300/50' : 'bg-white/10 border-white/10'}`}>{isRobot ? '🤖' : isGoal ? '🏁' : isObstacle ? '🪨' : isStar ? '⭐' : ''}</div>;
                            })}
                        </div>
                        <div className="mb-4 flex flex-wrap justify-center gap-2">
                            {commands.map((cmd, i) => <span key={`${cmd}-${i}`} className="rounded-lg bg-indigo-500/30 px-3 py-2 text-xl">{cmd}</span>)}
                            {commands.length === 0 && <span className="text-white/50">Add commands below</span>}
                        </div>
                        {gameState === 'planning' && <>
                            <div className="mb-4 flex justify-center gap-3">{DIRECTIONS.map(dir => <button key={dir} disabled={commands.length >= level.maxMoves} onClick={() => setCommands(c => [...c, dir])} className="h-14 w-14 rounded-xl bg-cyan-600 text-2xl hover:bg-cyan-500 disabled:opacity-40">{dir}</button>)}</div>
                            <div className="flex justify-center gap-3"><button onClick={() => setCommands(c => c.slice(0, -1))} className="rounded-xl bg-slate-600 px-4 py-2 text-white">Undo</button><button onClick={() => setCommands([])} className="rounded-xl bg-slate-600 px-4 py-2 text-white">Clear</button><button disabled={!commands.length} onClick={runCommands} className="rounded-xl bg-emerald-600 px-6 py-2 font-bold text-white disabled:opacity-40">Run ▶</button></div>
                        </>}
                        {gameState === 'result' && <div className={`mt-5 text-xl font-bold ${feedback === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback === 'success' ? 'Route complete!' : 'That program did not reach the goal. A solvable route is available.'}</div>}
                    </div>
                )}
                {gameState === 'gameover' && <GameOverScreen stars={stars} streak={maxStreak} onRestart={startGame} onBack={onBack} onSaveScore={handleSaveScore} playerName={playerName} setPlayerName={setPlayerName} scoreSaved={scoreSaved} />}
            </div>
        </SpaceBackground>
    );
};

export default PathPlannerGame;
