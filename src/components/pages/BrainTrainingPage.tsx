import React, { useMemo, useState } from 'react';
import { SpaceBackground } from '../shared/SpaceBackground';
import { BrainHistoryReview } from '../shared/BrainHistoryReview';
import { SKILL_GAMES } from '../../data/gameDefinitions';
import { GameDefinition, Difficulty, LeaderboardEntry, Settings } from '../../types';
import { BrainSessionRecord } from '../../types/brainProgress';
import { useAppContext } from '../../contexts/AppContext';
import { BRAIN_SKILL_BY_GAME, getBrainGameProgress, getBrainTrainingSummary } from '../../utils/brainTrainingMeta';
import { getBrainGameMastery, getBrainMasterySummary } from '../../utils/brainProgress';

interface BrainTrainingPageProps {
    onBack: () => void;
    onSelectGame: (game: GameDefinition) => void;
    onSelectDifficulty: (difficulty: Difficulty) => void;
    settings: Settings;
    leaderboard?: LeaderboardEntry[];
}

const trendLabel = (trend: number) => trend > 2 ? `↑ ${trend}` : trend < -2 ? `↓ ${Math.abs(trend)}` : '→ steady';

export const BrainTrainingPage: React.FC<BrainTrainingPageProps> = ({
    onBack,
    onSelectGame,
    onSelectDifficulty,
    settings: passedSettings,
    leaderboard = []
}) => {
    const { activeStudent, settings: contextSettings, updateSettings, brainSessions } = useAppContext();
    const settings = passedSettings || contextSettings;
    const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null);
    const [showDifficulty, setShowDifficulty] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<BrainSessionRecord | null>(null);

    const isUnlocked = (game: GameDefinition) => {
        if (!settings.surpriseMode) return true;
        const charSum = game.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (charSum % 3) !== 0;
    };

    const legacySummary = useMemo(
        () => getBrainTrainingSummary(
            leaderboard,
            SKILL_GAMES.map(game => game.id),
            activeStudent?.name,
            activeStudent?.id
        ),
        [leaderboard, activeStudent?.name, activeStudent?.id]
    );

    const masterySummary = useMemo(
        () => getBrainMasterySummary(brainSessions, activeStudent?.id, activeStudent?.name),
        [brainSessions, activeStudent?.id, activeStudent?.name]
    );

    const brainParticles = ['🧠', '💡', '⚡', '🎯', '✨', '🌟', '🔮', '💭'];

    const handleGameClick = (game: GameDefinition) => {
        if (!settings.difficultyFilterEnabled) {
            onSelectDifficulty('None');
            onSelectGame(game);
        } else {
            setSelectedGame(game);
            setShowDifficulty(true);
        }
    };

    const handleDifficultySelect = (difficulty: Difficulty) => {
        if (selectedGame) {
            onSelectDifficulty(difficulty);
            onSelectGame(selectedGame);
        }
    };

    const handleBackFromDifficulty = () => {
        setShowDifficulty(false);
        setSelectedGame(null);
    };

    const toggleRandomize = async () => {
        await updateSettings({
            ...contextSettings,
            randomize: !contextSettings.randomize,
        });
    };

    if (showDifficulty && selectedGame) {
        return (
            <SpaceBackground>
                <div className="flex flex-col items-center justify-center min-h-full px-4 py-6">
                    <button onClick={handleBackFromDifficulty} className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all z-30">
                        <span className="text-xl">←</span>
                        <span className="text-white font-medium">Back</span>
                    </button>

                    <div className="text-8xl mb-6" style={{ animation: 'bounce 1s ease-in-out infinite' }}>{selectedGame.icon}</div>
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedGame.title}</h2>
                    <p className="text-purple-200 mb-2">{selectedGame.description}</p>
                    <p className="mb-8 text-sm font-semibold text-fuchsia-200">{BRAIN_SKILL_BY_GAME[selectedGame.id]}</p>
                    <h3 className="text-xl text-white mb-4">Choose Your Challenge! 🎮</h3>

                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <button onClick={() => handleDifficultySelect('Easy')} className="group bg-gradient-to-r from-green-400 to-emerald-500 p-5 rounded-2xl shadow-xl hover:scale-105 transition-all border-2 border-green-300/50">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-4xl group-hover:animate-bounce">🌱</span><div className="text-left"><div className="text-xl font-bold text-white">Easy</div><div className="text-green-100 text-sm">1-step foundation</div></div></div><span className="text-2xl">→</span></div>
                        </button>
                        <button onClick={() => handleDifficultySelect('Medium')} className="group bg-gradient-to-r from-yellow-400 to-orange-500 p-5 rounded-2xl shadow-xl hover:scale-105 transition-all border-2 border-yellow-300/50">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-4xl group-hover:animate-bounce">🌟</span><div className="text-left"><div className="text-xl font-bold text-white">Medium</div><div className="text-yellow-100 text-sm">2-step reasoning</div></div></div><span className="text-2xl">→</span></div>
                        </button>
                        <button onClick={() => handleDifficultySelect('Hard')} className="group bg-gradient-to-r from-red-400 to-pink-500 p-5 rounded-2xl shadow-xl hover:scale-105 transition-all border-2 border-red-300/50">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-4xl group-hover:animate-bounce">🔥</span><div className="text-left"><div className="text-xl font-bold text-white">Hard</div><div className="text-red-100 text-sm">3-step challenge</div></div></div><span className="text-2xl">→</span></div>
                        </button>
                    </div>
                </div>
            </SpaceBackground>
        );
    }

    return (
        <>
            <SpaceBackground>
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    {brainParticles.map((particle, i) => (
                        <div key={i} className="absolute text-3xl opacity-30" style={{ left: `${5 + i * 12}%`, top: `${15 + (i % 4) * 20}%`, animation: `float ${3 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.25}s` }}>{particle}</div>
                    ))}
                </div>

                <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all z-30">
                    <span className="text-xl">←</span><span className="text-white font-medium">Back</span>
                </button>

                <button
                    onClick={toggleRandomize}
                    aria-pressed={contextSettings.randomize}
                    title="Global question-bank order. Applies to the next game."
                    className={`absolute top-4 right-4 z-30 flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold shadow-xl backdrop-blur transition-all hover:scale-105 ${contextSettings.randomize ? 'border-fuchsia-300/70 bg-fuchsia-600/85 text-white' : 'border-gray-500/70 bg-gray-900/85 text-gray-200'}`}
                >
                    <span>🔀</span><span>Questions {contextSettings.randomize ? 'Random' : 'In Order'}</span>
                </button>

                <div className="flex flex-col items-center min-h-full px-4 py-20 relative z-10 overflow-y-auto">
                    <div className="text-center mb-4">
                        <div className="text-7xl mb-2 inline-block" style={{ animation: 'float 2s ease-in-out infinite' }}>🧠</div>
                        <div className="flex items-center justify-center gap-2 mb-2"><span className="text-2xl animate-pulse">💡</span><span className="text-2xl animate-pulse" style={{ animationDelay: '0.3s' }}>⚡</span><span className="text-2xl animate-pulse" style={{ animationDelay: '0.6s' }}>✨</span></div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-center"><span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">Brain Training</span></h1>
                    <p className="text-purple-200 mb-5 text-center">Power up your thinking skills! 🚀</p>

                    {!activeStudent && (
                        <div className="mb-5 w-full max-w-3xl rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-center text-sm font-semibold text-amber-100">
                            Select a student profile to keep mastery and review history separate.
                        </div>
                    )}

                    <div className="mb-3 grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-xl border border-purple-400/30 bg-purple-950/50 p-3 text-center"><div className="text-xl font-black text-white">{masterySummary.totalSessions ? `${masterySummary.overallMastery}%` : '—'}</div><div className="text-[11px] uppercase tracking-wide text-purple-200">Overall mastery</div></div>
                        <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/40 p-3 text-center"><div className="text-xl font-black text-white">{masterySummary.totalSessions ? `${masterySummary.overallAccuracy}%` : '—'}</div><div className="text-[11px] uppercase tracking-wide text-cyan-200">Recent accuracy</div></div>
                        <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-3 text-center"><div className="truncate text-base font-black text-white">{masterySummary.strongestSkill?.skill || 'Start playing'}</div><div className="text-[11px] uppercase tracking-wide text-emerald-200">Strongest skill</div></div>
                        <div className="rounded-xl border border-orange-400/30 bg-orange-950/40 p-3 text-center"><div className="truncate text-base font-black text-white">{masterySummary.focusSkill?.skill || 'Build history'}</div><div className="text-[11px] uppercase tracking-wide text-orange-200">Practice focus</div></div>
                    </div>

                    <div className="mb-6 text-center text-xs text-purple-200/80">
                        {masterySummary.totalSessions} detailed mastery session{masterySummary.totalSessions === 1 ? '' : 's'} · {legacySummary.savedSessions} saved score{legacySummary.savedSessions === 1 ? '' : 's'} · {legacySummary.gamesTried}/{SKILL_GAMES.length} games tried
                    </div>

                    {masterySummary.skills.length > 0 && (
                        <div className="mb-6 w-full max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-black text-white">Skill mastery</h2><span className="text-xs text-white/55">Recent sessions weighted more</span></div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {masterySummary.skills.slice(0, 6).map(skill => (
                                    <div key={skill.skill} className="rounded-xl bg-white/5 p-3">
                                        <div className="mb-2 flex items-center justify-between gap-2"><span className="truncate text-sm font-bold text-white">{skill.skill}</span><span className="text-sm font-black text-violet-200">{skill.mastery}%</span></div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: `${skill.mastery}%` }} /></div>
                                        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-white/45"><span>{skill.sessions} session{skill.sessions === 1 ? '' : 's'}</span><span>{trendLabel(skill.trend)}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {masterySummary.recentSessions.length > 0 && (
                        <div className="mb-7 w-full max-w-5xl">
                            <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-xl font-black text-white">Recent reviews</h2><p className="text-xs text-purple-200">Reopen saved evidence instead of losing it after the game.</p></div></div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {masterySummary.recentSessions.map(session => (
                                    <button key={session.id} onClick={() => setSelectedHistory(session)} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-violet-300/50 hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/40">
                                        <div className="flex items-start justify-between gap-2"><div><div className="font-black text-white">{session.gameTitle}</div><div className="text-xs text-violet-200">{session.skill} · {session.difficulty}</div></div><span className="text-lg">↗</span></div>
                                        <div className="mt-3 flex gap-2 text-xs font-bold"><span className="rounded-full bg-violet-500/20 px-2 py-1 text-violet-100">Mastery {session.masteryScore}%</span><span className="rounded-full bg-cyan-500/15 px-2 py-1 text-cyan-100">Accuracy {session.accuracy}%</span></div>
                                        <div className="mt-3 text-[11px] text-white/45">{new Date(session.completedAt).toLocaleDateString()} · Tap to review</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
                        {SKILL_GAMES.map((game, index) => {
                            const unlocked = isUnlocked(game);
                            const scoreProgress = getBrainGameProgress(leaderboard, game.id, activeStudent?.name, activeStudent?.id);
                            const masteryProgress = getBrainGameMastery(brainSessions, game.id, activeStudent?.id, activeStudent?.name);
                            return (
                                <button
                                    key={game.id}
                                    onClick={() => unlocked && handleGameClick(game)}
                                    disabled={!unlocked}
                                    className={`relative bg-gradient-to-br ${game.color} p-5 rounded-2xl shadow-xl transition-all duration-300 text-left border-2 border-white/20 group focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50 ${unlocked ? 'hover:scale-105 hover:shadow-2xl cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'}`}
                                    style={{ animation: `slideIn 0.4s ease-out ${Math.min(index, 8) * 0.07}s both` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-5xl group-hover:scale-125 transition-transform duration-300" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{game.icon}</div>
                                        <div className="flex-1 min-w-0"><h3 className="text-xl font-bold text-white mb-1">{game.title}</h3><p className="text-white/80 text-sm">{game.description}</p></div>
                                        <div className="text-2xl opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] font-semibold text-white/90">{BRAIN_SKILL_BY_GAME[game.id]}</span>
                                        {masteryProgress.sessions > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-black text-white">Mastery {masteryProgress.mastery}% · {trendLabel(masteryProgress.trend)}</span>}
                                    </div>

                                    {masteryProgress.sessions > 0 ? (
                                        <div className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-xs text-white/90">
                                            <div className="flex justify-between"><span>{masteryProgress.sessions} detailed session{masteryProgress.sessions === 1 ? '' : 's'}</span><strong>{masteryProgress.accuracy}% accuracy</strong></div>
                                            <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-bold">
                                                {(['Easy', 'Medium', 'Hard', 'Mixed'] as const).map(level => masteryProgress.byDifficulty[level] !== undefined ? <span key={level} className="rounded bg-white/10 px-1.5 py-0.5">{level[0]} {masteryProgress.byDifficulty[level]}%</span> : null)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-xs text-white/80">
                                            {scoreProgress.plays > 0 ? <span>Legacy best ⭐ {scoreProgress.bestStars} · play once more to start mastery tracking</span> : <span className="font-semibold text-white/75">New challenge · no mastery history yet</span>}
                                        </div>
                                    )}

                                    {!unlocked && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl"><div className="text-4xl">🔒</div></div>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 text-center"><p className="text-purple-300 text-sm">Mastery is based on accuracy and challenge level, not raw stars alone. 🎯</p></div>
                </div>

                <style>{`
                    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>
            </SpaceBackground>
            {selectedHistory && <BrainHistoryReview session={selectedHistory} onClose={() => setSelectedHistory(null)} />}
        </>
    );
};

export default BrainTrainingPage;
