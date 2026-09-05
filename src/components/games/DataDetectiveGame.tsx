import React, { useState, useEffect } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { Header } from '../shared/Header';
import { GameOverScreen } from '../shared/GameOverScreen';
import { useAppContext } from '../../contexts/AppContext';
import { Difficulty } from '../../types';

interface DataDetectiveGameProps {
    onBack: () => void;
    difficulty: Difficulty;
}

type ChartType = 'bar' | 'pie' | 'line';

interface DataPoint {
    label: string;
    value: number;
    color: string;
}

export const DataDetectiveGame: React.FC<DataDetectiveGameProps> = ({ onBack, difficulty }) => {
    const { addLeaderboardEntry } = useAppContext();

    // Game state
    const [gameState, setGameState] = useState<'start' | 'play' | 'result' | 'gameover'>('start');
    const [, setRound] = useState(1);
    const [stars, setStars] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timer, setTimer] = useState(60);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);

    // Level data
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    // Generate random level
    const generateLevel = () => {
        const types: ChartType[] = difficulty === 'Easy' ? ['bar'] : difficulty === 'Medium' ? ['bar', 'pie'] : ['bar', 'pie', 'line'];
        const type = types[Math.floor(Math.random() * types.length)];
        setChartType(type);

        // Generate data
        const categories = ['Apples', 'Bananas', 'Oranges', 'Grapes', 'Pears', 'mangos'];
        const colors = ['#FF6B6B', '#FFD93D', '#FFA500', '#9D4EDD', '#98FB98', '#FF6347'];
        const count = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 4 : 5;

        // Shuffle categories
        const shuffled = [...categories].sort(() => Math.random() - 0.5).slice(0, count);
        const points: DataPoint[] = shuffled.map((cat, i) => ({
            label: cat,
            value: Math.floor(Math.random() * 8) + 2, // 2-10
            color: colors[i]
        }));

        setDataPoints(points);

        // Generate question
        const qTypes = ['max', 'min', 'sum', 'compare'];
        const qType = qTypes[Math.floor(Math.random() * qTypes.length)];

        let qText = '';
        let ans = '';

        switch (qType) {
            case 'max':
                const max = points.reduce((prev, curr) => (prev.value > curr.value ? prev : curr));
                qText = `Which item has the most?`;
                ans = max.label;
                break;
            case 'min':
                const min = points.reduce((prev, curr) => (prev.value < curr.value ? prev : curr));
                qText = `Which item has the least?`;
                ans = min.label;
                break;
            case 'sum':
                if (difficulty === 'Easy') {
                    // Easier sum question for Easy mode
                    const p1 = points[0];
                    const p2 = points[1];
                    qText = `How many ${p1.label} and ${p2.label} together?`;
                    ans = (p1.value + p2.value).toString();
                } else {
                    qText = `How many items in total?`;
                    ans = points.reduce((sum, p) => sum + p.value, 0).toString();
                }
                break;
            case 'compare':
                const pA = points[0];
                const pB = points[1];
                if (pA.value > pB.value) {
                    qText = `Are there more ${pA.label} than ${pB.label}?`;
                    ans = 'Yes';
                } else if (pA.value < pB.value) {
                    qText = `Are there more ${pA.label} than ${pB.label}?`;
                    ans = 'No';
                } else {
                    qText = `Do ${pA.label} and ${pB.label} have the same amount?`;
                    ans = 'Yes';
                }
                break;
        }

        setQuestion(qText);
        setCorrectAnswer(ans);

        // Generate options
        const opts = new Set<string>();
        opts.add(ans);
        while (opts.size < 4) {
            if (qType === 'max' || qType === 'min') {
                opts.add(points[Math.floor(Math.random() * points.length)].label);
            } else if (qType === 'sum') {
                const val = parseInt(ans) + Math.floor(Math.random() * 5) - 2;
                if (val > 0) opts.add(val.toString());
            } else if (qType === 'compare') {
                opts.add('Yes');
                opts.add('No');
                // Only 2 options for Yes/No
                break;
            }
        }
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
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

    const handleAnswer = (selected: string) => {
        if (selected === correctAnswer) {
            setStars(s => s + 10 + streak * 2);
            setStreak(s => {
                const n = s + 1;
                setMaxStreak(m => Math.max(m, n));
                return n;
            });
            setFeedback('correct');
        } else {
            setStreak(0);
            setFeedback('wrong');
        }

        setTimeout(() => {
            setFeedback(null);
            setRound(r => r + 1);
            generateLevel();
        }, 1500);
    };

    const [showHint, setShowHint] = React.useState(false);

    useEffect(() => {
        setShowHint(false);
        const timer = setTimeout(() => setShowHint(true), 5000);
        return () => clearTimeout(timer);
    }, [question]);

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
            game: 'data-detective',
            name: playerName,
            stars,
            streak: maxStreak,
            date: new Date().toISOString()
        });
        setScoreSaved(true);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // Render Charts
    const renderBarChart = () => {
        const maxVal = Math.max(...dataPoints.map(p => p.value));
        return (
            <div className="flex items-end justify-center gap-4 h-48 w-full max-w-md bg-white/10 rounded-xl p-4">
                {dataPoints.map((p, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 w-12">
                        <div
                            className="w-full rounded-t-md transition-all duration-500"
                            style={{
                                height: `${(p.value / maxVal) * 120}px`,
                                backgroundColor: p.color
                            }}
                        >
                            <span className="text-xs font-bold text-black drop-shadow-sm flex justify-center pt-1">{p.value}</span>
                        </div>
                        <span className="text-xs text-white truncate max-w-full text-center" title={p.label}>
                            {p.label === 'Bananas' ? '🍌' : p.label === 'Apples' ? '🍎' : p.label === 'Oranges' ? '🍊' : p.label === 'Grapes' ? '🍇' : p.label === 'Pears' ? '🍐' : '🥭'}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const renderPieChart = () => {
        // Simple CSS conic-gradient pie chart
        const total = dataPoints.reduce((sum, p) => sum + p.value, 0);
        let currentAngle = 0;
        const gradientParts = dataPoints.map(p => {
            const start = (currentAngle / total) * 100;
            currentAngle += p.value;
            const end = (currentAngle / total) * 100;
            return `${p.color} ${start}% ${end}%`;
        }).join(', ');

        return (
            <div className="flex flex-col items-center">
                <div
                    className="w-40 h-40 rounded-full border-4 border-white/20 mb-4 transition-all duration-500"
                    style={{ background: `conic-gradient(${gradientParts})` }}
                />
                <div className="flex flex-wrap justify-center gap-3">
                    {dataPoints.map((p, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-xs text-white">{p.label}: {p.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <SpaceBackground variant="skill">
            <Header timer={timer} streak={streak} stars={stars} onBack={onBack} formatTime={formatTime} difficulty={difficulty} />

            <div className="flex flex-col items-center justify-center min-h-full pt-20 px-4">
                {gameState === 'start' && (
                    <div className="text-center">
                        <div className="text-7xl mb-4" style={{ animation: 'float 2s ease-in-out infinite' }}>📊</div>
                        <h1 className="text-4xl font-bold text-white mb-2">Data Detective</h1>
                        <p className="text-cyan-200 mb-4">Investigate the charts and find the answers!</p>
                        <button
                            onClick={startGame}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-lg cursor-pointer"
                        >
                            START GAME
                        </button>
                    </div>
                )}

                {gameState === 'play' && (
                    <div className="flex flex-col items-center w-full max-w-2xl">
                        <div className="bg-gray-800/80 backdrop-blur border border-cyan-500/30 rounded-2xl p-6 w-full mb-6 shadow-2xl animate-slideIn">
                            <h2 className="text-xl text-cyan-100 mb-6 text-center">{question}</h2>
                            {showHint && <div className="text-center text-cyan-300 mb-4 animate-bounce">💡 Hint: Look closely at the chart!</div>}

                            <div className="flex justify-center mb-6">
                                {chartType === 'bar' && renderBarChart()}
                                {chartType === 'pie' && renderPieChart()}
                                {chartType === 'line' && renderBarChart()} {/* Fallback to bar for now for simplicity, or treat same */}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswer(opt)}
                                        className="bg-gray-700/50 hover:bg-cyan-600/50 border border-cyan-500/30 text-white p-4 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {feedback && (
                            <div className={`text-2xl font-bold animate-bounce ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                {feedback === 'correct' ? 'Correct! 🎉' : 'Oops! 😅'}
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

export default DataDetectiveGame;
