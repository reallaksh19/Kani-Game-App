import React, { useEffect, useMemo, useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';
import { DataRound, generateDataRound } from '../../utils/brainGameGenerators';

interface DataDetectiveGameProps { onBack: () => void; difficulty: Difficulty; }

export const DataDetectiveGame: React.FC<DataDetectiveGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();
    const [gameState, setGameState] = useState<'start' | 'play' | 'result' | 'gameover'>('start');
    const [round, setRound] = useState<DataRound | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(60);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);
    const [attempted, setAttempted] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    const nextRound = () => {
        setRound(generateDataRound(difficulty));
        setSelected(null);
        setGameState('play');
    };
    const startGame = () => {
        setStars(0);
        setStreak(0);
        setMaxStreak(0);
        setTimer(60);
        setScoreSaved(false);
        setAttempted(0);
        setCorrectCount(0);
        nextRound();
    };
    const answer = (value: string) => {
        if (!round || gameState !== 'play') return;
        setSelected(value);
        setAttempted(count => count + 1);
        if (value === round.answer) {
            setCorrectCount(count => count + 1);
            const multiplier = round.difficulty === 'Hard' ? 2 : round.difficulty === 'Medium' ? 1.5 : 1;
            setStars(s => s + Math.floor((10 + streak * 2) * multiplier));
            setStreak(s => { const n = s + 1; setMaxStreak(m => Math.max(m, n)); return n; });
        } else setStreak(0);
        setGameState('result');
        window.setTimeout(nextRound, 1600);
    };

    useEffect(() => {
        if (gameState !== 'play' && gameState !== 'result') return;
        const id = window.setInterval(() => setTimer(t => {
            if (t <= 1) { setGameState('gameover'); return 0; }
            return t - 1;
        }), 1000);
        return () => window.clearInterval(id);
    }, [gameState]);

    const handleSaveScore = async () => {
        if (!playerName.trim()) return;
        await addLeaderboardEntry({ game: 'data-detective', name: playerName, stars, streak: maxStreak, date: new Date().toISOString() });
        setScoreSaved(true);
    };
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const maxValue = useMemo(() => Math.max(1, ...(round?.points.map(p => p.value) ?? [1])), [round]);

    const chart = round && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            {round.chartType === 'line' ? (
                <svg viewBox="0 0 420 180" className="h-48 w-full" role="img" aria-label="Line chart">
                    <polyline fill="none" stroke="currentColor" strokeWidth="4" className="text-cyan-300" points={round.points.map((p, i) => `${35 + i * (350 / Math.max(1, round.points.length - 1))},${150 - (p.value / maxValue) * 110}`).join(' ')} />
                    {round.points.map((p, i) => {
                        const x = 35 + i * (350 / Math.max(1, round.points.length - 1)); const y = 150 - (p.value / maxValue) * 110;
                        return <g key={p.label}><circle cx={x} cy={y} r="7" className="fill-cyan-300" /><text x={x} y="172" textAnchor="middle" className="fill-white text-[10px]">{p.label}</text><text x={x} y={y - 12} textAnchor="middle" className="fill-white text-[11px] font-bold">{p.value}</text></g>;
                    })}
                </svg>
            ) : round.chartType === 'pie' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{round.points.map(p => <div key={p.label} className="rounded-xl bg-white/10 p-3 text-center"><div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border-8 border-fuchsia-400/70 text-xl font-black text-white">{p.value}</div><div className="text-sm font-semibold text-white">{p.label}</div></div>)}</div>
            ) : (
                <div className="space-y-3">{round.points.map(p => <div key={p.label} className="grid grid-cols-[90px_1fr_36px] items-center gap-2"><span className="text-right text-sm text-white">{p.label}</span><div className="h-7 rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400/80" style={{ width: `${Math.max(8, (p.value / maxValue) * 100)}%` }} /></div><span className="font-black text-white">{p.value}</span></div>)}</div>
            )}
        </div>
    );

    return (
        <SpaceBackground variant="skill">
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={formatTime} difficulty={difficulty} />
            <div className="flex min-h-full items-center justify-center px-4 pt-20">
                {gameState === 'start' && <div className="max-w-lg text-center"><div className="text-7xl mb-4">📊</div><h1 className="text-4xl font-bold text-white mb-2">Data Detective</h1><p className="text-cyan-200 mb-6">Read charts carefully. Values are generated uniquely, so maximum and minimum questions always have one valid answer.</p><button onClick={startGame} className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-8 py-4 text-xl font-bold text-white hover:scale-105 transition-transform">START GAME</button></div>}
                {(gameState === 'play' || gameState === 'result') && round && <div className="w-full max-w-3xl"><div className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-cyan-200">{round.difficulty} · {round.chartType} chart</div>{chart}<h2 className="my-6 text-center text-2xl font-bold text-white">{round.question}</h2><div className={`grid gap-3 ${round.options.length === 2 ? 'grid-cols-2 max-w-md mx-auto' : 'grid-cols-2 sm:grid-cols-4'}`}>{round.options.map(opt => { const show = gameState === 'result'; const correct = opt === round.answer; const chosen = opt === selected; return <button key={opt} disabled={show} onClick={() => answer(opt)} className={`rounded-2xl border-2 px-4 py-4 font-bold transition ${show && correct ? 'border-emerald-300 bg-emerald-500 text-white' : show && chosen ? 'border-rose-300 bg-rose-500 text-white' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}>{opt}</button>; })}</div>{gameState === 'result' && <div className={`mt-5 text-center text-xl font-bold ${selected === round.answer ? 'text-emerald-300' : 'text-rose-300'}`}>{selected === round.answer ? 'Correct read!' : `Correct answer: ${round.answer}`}</div>}</div>}
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
                        gameTitle="Data Detective"
                        skill="Data Reasoning"
                        difficulty={difficulty === 'None' ? 'Mixed' : difficulty}
                        correct={correctCount}
                        attempted={attempted}
                        durationSeconds={60 - timer}
                        backLabel="BRAIN HUB"
                    />
                )}
            </div>
        </SpaceBackground>
    );
};

export default DataDetectiveGame;
