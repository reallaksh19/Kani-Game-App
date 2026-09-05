import React, { useEffect, useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';
import { chooseVennPair, classifyVennItem, pickVennItem, VennItem, VennPair, VennZone, vennTargetCount, ActiveDifficulty } from '../../utils/brainGameGenerators';

interface VennVoyagerGameProps { onBack: () => void; difficulty: Difficulty; }
const zoneLabel = (zone: VennZone, pair: VennPair) => zone === 'A' ? `${pair.A} only` : zone === 'B' ? `${pair.B} only` : zone === 'Both' ? 'Both' : 'Neither';

export const VennVoyagerGame: React.FC<VennVoyagerGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();
    const [gameState, setGameState] = useState<'start' | 'play' | 'result' | 'gameover'>('start');
    const [activeDifficulty, setActiveDifficulty] = useState<ActiveDifficulty>('Easy');
    const [pair, setPair] = useState<VennPair>({ A: 'red', B: 'fruit' });
    const [item, setItem] = useState<VennItem | null>(null);
    const [sortedCount, setSortedCount] = useState(0);
    const [feedback, setFeedback] = useState<{ chosen: VennZone; correct: VennZone } | null>(null);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(60);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);

    const makePair = () => {
        const next = chooseVennPair(difficulty);
        setActiveDifficulty(next.difficulty);
        setPair(next.pair);
        setSortedCount(0);
        setItem(pickVennItem(next.pair));
        setFeedback(null);
        setGameState('play');
    };
    const startGame = () => { setStars(0); setStreak(0); setMaxStreak(0); setTimer(60); setScoreSaved(false); makePair(); };

    const checkSort = (zone: VennZone) => {
        if (!item || gameState !== 'play') return;
        const correct = classifyVennItem(item, pair);
        setFeedback({ chosen: zone, correct });
        const isCorrect = zone === correct;
        if (isCorrect) {
            const multiplier = activeDifficulty === 'Hard' ? 2 : activeDifficulty === 'Medium' ? 1.5 : 1;
            setStars(s => s + Math.floor((10 + streak) * multiplier));
            setStreak(s => { const n = s + 1; setMaxStreak(m => Math.max(m, n)); return n; });
        } else setStreak(0);
        setGameState('result');

        window.setTimeout(() => {
            const nextCount = isCorrect ? sortedCount + 1 : sortedCount;
            if (isCorrect && nextCount >= vennTargetCount(activeDifficulty)) {
                makePair();
                return;
            }
            if (isCorrect) setSortedCount(nextCount);
            setItem(current => pickVennItem(pair, Math.random, current?.id));
            setFeedback(null);
            setGameState('play');
        }, 1100);
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
        await addLeaderboardEntry({ game: 'venn-voyager', name: playerName, stars, streak: maxStreak, date: new Date().toISOString() });
        setScoreSaved(true);
    };
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const target = vennTargetCount(activeDifficulty);

    return (
        <SpaceBackground variant="skill">
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={formatTime} difficulty={difficulty} />
            <div className="flex min-h-full items-center justify-center px-4 pt-20">
                {gameState === 'start' && <div className="max-w-lg text-center"><div className="text-7xl mb-4">⭕</div><h1 className="text-4xl font-bold text-white mb-2">Venn Voyager</h1><p className="text-fuchsia-200 mb-4">Classify each item into A only, B only, both sets, or neither. Difficulty now changes the predicates and mastery target.</p><button onClick={startGame} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-8 py-4 text-xl font-bold text-white hover:scale-105 transition-transform">START GAME</button></div>}
                {(gameState === 'play' || gameState === 'result') && item && <div className="w-full max-w-2xl text-center"><div className="mb-3 text-sm font-bold uppercase tracking-wider text-fuchsia-200">{activeDifficulty} · {sortedCount}/{target} correct in this set</div><div className="relative mx-auto mb-6 h-52 max-w-md"><div className="absolute left-12 top-4 flex h-40 w-40 items-center justify-center rounded-full border-4 border-rose-300 bg-rose-500/20"><span className="-translate-x-6 font-black uppercase text-white">{pair.A}</span></div><div className="absolute right-12 top-4 flex h-40 w-40 items-center justify-center rounded-full border-4 border-blue-300 bg-blue-500/20"><span className="translate-x-6 font-black uppercase text-white">{pair.B}</span></div></div><div className="mb-6"><div className="text-6xl mb-2">{item.emoji}</div><div className="text-2xl font-black text-white">{item.label}</div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(['A', 'Both', 'B', 'None'] as VennZone[]).map(zone => { const show = gameState === 'result'; const correct = feedback?.correct === zone; const chosen = feedback?.chosen === zone; return <button key={zone} disabled={show} onClick={() => checkSort(zone)} className={`rounded-2xl border-2 p-4 font-bold capitalize transition ${show && correct ? 'border-emerald-300 bg-emerald-500 text-white' : show && chosen ? 'border-rose-300 bg-rose-500 text-white' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}>{zoneLabel(zone, pair)}</button>; })}</div>{feedback && <div className={`mt-5 text-lg font-bold ${feedback.chosen === feedback.correct ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.chosen === feedback.correct ? 'Correct classification!' : `Correct zone: ${zoneLabel(feedback.correct, pair)}`}</div>}</div>}
                {gameState === 'gameover' && <GameOverScreen stars={stars} streak={maxStreak} onRestart={startGame} onBack={onBack} onSaveScore={handleSaveScore} playerName={playerName} setPlayerName={setPlayerName} scoreSaved={scoreSaved} />}
            </div>
        </SpaceBackground>
    );
};

export default VennVoyagerGame;
