import React, { useEffect, useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';
import { generateScaleRound, ScaleRound } from '../../utils/brainGameGenerators';

interface ScaleSenseGameProps { onBack: () => void; difficulty: Difficulty; }

export const ScaleSenseGame: React.FC<ScaleSenseGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();
    const [gameState, setGameState] = useState<'start' | 'play' | 'result' | 'gameover'>('start');
    const [round, setRound] = useState<ScaleRound | null>(null);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(60);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);

    const nextRound = () => {
        setRound(generateScaleRound(difficulty));
        setSelected(null);
        setGameState('play');
    };

    const startGame = () => {
        setStars(0); setStreak(0); setMaxStreak(0); setTimer(60); setScoreSaved(false);
        nextRound();
    };

    const handleAnswer = (value: number) => {
        if (!round || gameState !== 'play') return;
        setSelected(value);
        const correct = value === round.answer;
        if (correct) {
            const multiplier = round.difficulty === 'Hard' ? 2 : round.difficulty === 'Medium' ? 1.5 : 1;
            setStars(s => s + Math.floor((10 + streak * 2) * multiplier));
            setStreak(s => { const n = s + 1; setMaxStreak(m => Math.max(m, n)); return n; });
        } else {
            setStreak(0);
        }
        setGameState('result');
        window.setTimeout(nextRound, 1500);
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
        await addLeaderboardEntry({ game: 'scale-sense', name: playerName, stars, streak: maxStreak, date: new Date().toISOString() });
        setScoreSaved(true);
    };
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <SpaceBackground variant="skill">
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={formatTime} difficulty={difficulty} />
            <div className="flex min-h-full items-center justify-center px-4 pt-20">
                {gameState === 'start' && (
                    <div className="max-w-lg text-center">
                        <div className="text-7xl mb-4">⚖️</div>
                        <h1 className="text-4xl font-bold text-white mb-2">Scale Sense</h1>
                        <p className="text-amber-200 mb-4">Add the visible weights, then choose the weight that balances the scale.</p>
                        <p className="text-white/70 text-sm mb-6">Easy uses 2 weights, Medium 3, Hard 4. The total is never shown before you answer.</p>
                        <button onClick={startGame} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform">START GAME</button>
                    </div>
                )}

                {(gameState === 'play' || gameState === 'result') && round && (
                    <div className="w-full max-w-2xl text-center">
                        <div className="mb-3 text-sm font-bold uppercase tracking-wider text-amber-200">{round.difficulty} · {round.leftItems.length} weights</div>
                        <div className="relative mx-auto mb-10 h-56 max-w-xl">
                            <div className="absolute bottom-0 left-1/2 h-36 w-4 -translate-x-1/2 rounded-t bg-slate-400" />
                            <div className="absolute top-20 left-1/2 h-2 w-4/5 -translate-x-1/2 bg-slate-300 transition-transform duration-500"
                                style={{ transform: `translateX(-50%) rotate(${selected === null ? 0 : selected < round.answer ? -9 : selected > round.answer ? 9 : 0}deg)` }}>
                                <div className="absolute left-0 top-2 w-40 -translate-x-1/3 rounded-2xl border border-amber-300/40 bg-amber-950/70 p-3">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {round.leftItems.map((value, i) => <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white font-black">{value}</span>)}
                                    </div>
                                </div>
                                <div className="absolute right-0 top-2 w-28 translate-x-1/3 rounded-2xl border border-indigo-300/40 bg-indigo-950/70 p-4 text-2xl font-black text-white">
                                    {selected ?? '?'}
                                </div>
                            </div>
                        </div>
                        <div className="mb-4 text-xl font-bold text-white">Which weight balances the scale?</div>
                        <div className="flex flex-wrap justify-center gap-3">
                            {round.options.map(value => {
                                const show = gameState === 'result';
                                const correct = value === round.answer;
                                const chosen = value === selected;
                                return <button key={value} disabled={show} onClick={() => handleAnswer(value)} className={`h-16 w-16 rounded-full border-2 text-xl font-black transition ${show && correct ? 'bg-emerald-500 border-emerald-200 text-white' : show && chosen ? 'bg-rose-500 border-rose-200 text-white' : 'bg-amber-500 border-amber-300 text-white hover:scale-110'}`}>{value}</button>;
                            })}
                        </div>
                        {gameState === 'result' && <div className={`mt-6 text-xl font-bold ${selected === round.answer ? 'text-emerald-300' : 'text-rose-300'}`}>{selected === round.answer ? 'Balanced!' : `Not quite — ${round.leftItems.join(' + ')} = ${round.answer}`}</div>}
                    </div>
                )}

                {gameState === 'gameover' && <GameOverScreen stars={stars} streak={maxStreak} onRestart={startGame} onBack={onBack} onSaveScore={handleSaveScore} playerName={playerName} setPlayerName={setPlayerName} scoreSaved={scoreSaved} />}
            </div>
        </SpaceBackground>
    );
};

export default ScaleSenseGame;
