import React, { useEffect, useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';
import { BrainReviewItem } from '../../types/brainReview';
import { generateMirrorRound, MirrorRound } from '../../utils/brainGameGenerators';

interface MirrorMatchGameProps { onBack: () => void; difficulty: Difficulty; }

export const MirrorMatchGame: React.FC<MirrorMatchGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();
    const [gameState, setGameState] = useState<'start' | 'play' | 'result' | 'gameover'>('start');
    const [round, setRound] = useState<MirrorRound | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(60);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);
    const [attempted, setAttempted] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [reviewItems, setReviewItems] = useState<BrainReviewItem[]>([]);

    const nextRound = () => { setRound(generateMirrorRound(difficulty)); setSelectedIndex(null); setGameState('play'); };
    const startGame = () => {
        setStars(0);
        setStreak(0);
        setMaxStreak(0);
        setTimer(60);
        setScoreSaved(false);
        setAttempted(0);
        setCorrectCount(0);
        setReviewItems([]);
        nextRound();
    };

    const handleAnswer = (index: number) => {
        if (!round || gameState !== 'play') return;
        const isCorrect = index === round.correctIndex;
        setSelectedIndex(index);
        setAttempted(value => value + 1);
        setReviewItems(items => [...items, {
            kind: 'mirror',
            id: `mirror-${items.length + 1}-${Date.now()}`,
            round: items.length + 1,
            correct: isCorrect,
            difficulty: round.difficulty,
            size: round.size,
            axis: round.axis,
            pattern: [...round.pattern],
            selectedPattern: [...round.options[index]],
            correctPattern: [...round.options[round.correctIndex]],
        }]);
        if (isCorrect) {
            setCorrectCount(value => value + 1);
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
        await addLeaderboardEntry({ game: 'mirror-match', name: playerName, stars, streak: maxStreak, date: new Date().toISOString() });
        setScoreSaved(true);
    };
    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const renderGrid = (grid: number[], size: number, large = false) => (
        <div className="grid rounded-xl border-2 border-slate-500 bg-slate-900 p-2" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, width: large ? 150 : 100, height: large ? 150 : 100, gap: 4 }}>
            {grid.map((cell, i) => <div key={i} className={`rounded ${cell ? 'bg-teal-300' : 'bg-slate-700'}`} />)}
        </div>
    );

    return (
        <SpaceBackground variant="skill">
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={formatTime} difficulty={difficulty} />
            <div className="flex min-h-full items-center justify-center px-4 pt-20">
                {gameState === 'start' && <div className="max-w-lg text-center"><div className="text-7xl mb-4">🪞</div><h1 className="text-4xl font-bold text-white mb-2">Mirror Match</h1><p className="text-teal-200 mb-4">Find the exact reflection. Symmetric source patterns are rejected and every round has four unique choices.</p><p className="text-white/60 text-sm mb-6">Easy: 3×3 vertical mirror. Medium/Hard: 4×4 with vertical or horizontal axes and closer distractors.</p><button onClick={startGame} className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-8 py-4 text-xl font-bold text-white hover:scale-105 transition-transform">START GAME</button></div>}
                {(gameState === 'play' || gameState === 'result') && round && <div className="w-full max-w-3xl text-center"><div className="mb-4 text-sm font-bold uppercase tracking-wider text-teal-200">{round.difficulty} · reflect across the {round.axis} axis</div><div className="mb-8 flex items-center justify-center gap-6"><div><div className="mb-2 font-bold text-white">PATTERN</div>{renderGrid(round.pattern, round.size, true)}</div><div className={`bg-white/70 ${round.axis === 'vertical' ? 'h-40 w-1' : 'h-1 w-40'}`} /><div><div className="mb-2 font-bold text-white">MIRROR</div><div className="flex h-[150px] w-[150px] items-center justify-center rounded-xl border-2 border-dashed border-white/30 text-4xl text-white/60">?</div></div></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{round.options.map((opt, i) => { const show = gameState === 'result'; const correct = i === round.correctIndex; const chosen = i === selectedIndex; return <button key={opt.join('')} disabled={show} onClick={() => handleAnswer(i)} className={`mx-auto rounded-2xl border-2 p-2 transition ${show && correct ? 'border-emerald-300 bg-emerald-500/30' : show && chosen ? 'border-rose-300 bg-rose-500/30' : 'border-white/20 bg-white/5 hover:border-teal-300'}`}>{renderGrid(opt, round.size)}</button>; })}</div>{gameState === 'result' && <div className={`mt-6 text-xl font-bold ${selectedIndex === round.correctIndex ? 'text-emerald-300' : 'text-rose-300'}`}>{selectedIndex === round.correctIndex ? 'Perfect reflection!' : 'That is not the exact reflection.'}</div>}</div>}
                {gameState === 'gameover' && <GameOverScreen stars={stars} streak={maxStreak} onRestart={startGame} onBack={onBack} onSaveScore={handleSaveScore} playerName={playerName} setPlayerName={setPlayerName} scoreSaved={scoreSaved} gameTitle="Mirror Match" skill="Visual-Spatial Reasoning" difficulty={difficulty === 'None' ? 'Mixed' : difficulty} correct={correctCount} attempted={attempted} durationSeconds={60 - timer} backLabel="BRAIN HUB" reviewItems={reviewItems} />}
            </div>
        </SpaceBackground>
    );
};

export default MirrorMatchGame;
