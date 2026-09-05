import React, { useState, Suspense } from 'react';
import { useAppContext } from './contexts/AppContext';
import { ALL_GAMES, MATH_GAMES, GRAMMAR_GAMES, VOCABULARY_GAMES, COMPREHENSION_GAMES, SKILL_GAMES, EXAM_GAMES, LQ_CHAMP_GAMES } from './data/gameDefinitions';
import { Difficulty, GameDefinition } from './types';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

// Lazy load page components for better performance
const SettingsPage = React.lazy(() => import('./components/pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const AnalyticsPage = React.lazy(() => import('./components/pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const EnhancedQAPage = React.lazy(() => import('./components/pages/EnhancedQAPage').then(module => ({ default: module.EnhancedQAPage })));
const SheetBasedGame = React.lazy(() => import('./components/pages/SheetBasedGame').then(module => ({ default: module.SheetBasedGame })));
const DifficultySelector = React.lazy(() => import('./components/pages/DifficultySelector').then(module => ({ default: module.DifficultySelector })));
const GameTilesPage = React.lazy(() => import('./components/pages/GameTilesPage').then(module => ({ default: module.GameTilesPage })));
const EnglishLandingPage = React.lazy(() => import('./components/pages/EnglishLandingPage').then(module => ({ default: module.EnglishLandingPage })));
const MainLandingPage = React.lazy(() => import('./components/pages/MainLandingPage').then(module => ({ default: module.MainLandingPage })));
const BrainTrainingPage = React.lazy(() => import('./components/pages/BrainTrainingPage').then(module => ({ default: module.BrainTrainingPage })));
const LQChampHubPage = React.lazy(() => import('./components/pages/LQChampHubPage').then(module => ({ default: module.LQChampHubPage })));

// Interactive game components
const MemoryMatrixGame = React.lazy(() => import('./components/games/MemoryMatrixGame').then(module => ({ default: module.MemoryMatrixGame })));
const SequenceSprintGame = React.lazy(() => import('./components/games/SequenceSprintGame').then(module => ({ default: module.SequenceSprintGame })));
const PathPlannerGame = React.lazy(() => import('./components/games/PathPlannerGame').then(module => ({ default: module.PathPlannerGame })));
const DataDetectiveGame = React.lazy(() => import('./components/games/DataDetectiveGame').then(module => ({ default: module.DataDetectiveGame })));
const VennVoyagerGame = React.lazy(() => import('./components/games/VennVoyagerGame').then(module => ({ default: module.VennVoyagerGame })));
const MirrorMatchGame = React.lazy(() => import('./components/games/MirrorMatchGame').then(module => ({ default: module.MirrorMatchGame })));
const ScaleSenseGame = React.lazy(() => import('./components/games/ScaleSenseGame').then(module => ({ default: module.ScaleSenseGame })));

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

const LearningGalaxy: React.FC = () => {
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  const [englishCategory, setEnglishCategory] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showQA, setShowQA] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { settings, updateSettings, leaderboard } = useAppContext();

  const totalStars = leaderboard.reduce((sum, e) => sum + e.stars, 0);
  const handleBackToHome = () => { setCurrentSubject(null); setEnglishCategory(null); setCurrentGame(null); setSelectedDifficulty(null); };



  return (
    <Suspense fallback={<LoadingScreen />}>
      {(() => {
        if (showSettings) return <SettingsPage settings={settings} setSettings={updateSettings} onBack={() => setShowSettings(false)} />;
        if (showLeaderboard) return <AnalyticsPage onBack={() => setShowLeaderboard(false)} leaderboard={leaderboard} />;
        if (showQA) return <EnhancedQAPage onBack={() => setShowQA(false)} leaderboard={leaderboard} />;

        if (currentGame && selectedDifficulty) {
          // Route to interactive games (Phase 3 & 4)
          if (currentGame === 'memory-matrix') return <MemoryMatrixGame onBack={handleBackToHome} difficulty={selectedDifficulty} />;
          if (currentGame === 'sequence-sprint') return <SequenceSprintGame onBack={handleBackToHome} difficulty={selectedDifficulty} />;
          if (currentGame === 'path-planner') return <PathPlannerGame onBack={handleBackToHome} difficulty={selectedDifficulty} />;
          if (currentGame === 'data-detective') return <DataDetectiveGame onBack={handleBackToHome} difficulty={selectedDifficulty} />;
          if (currentGame === 'venn-voyager') return <VennVoyagerGame onBack={handleBackToHome} difficulty={selectedDifficulty} />;
          if (currentGame === 'mirror-match') return <MirrorMatchGame onBack={handleBackToHome} difficulty={selectedDifficulty} />;
          if (currentGame === 'scale-sense') return <ScaleSenseGame onBack={handleBackToHome} difficulty={selectedDifficulty} />;
          // Route to sheet-based games
          const gameInfo = ALL_GAMES.find(g => g.id === currentGame);
          const variant = MATH_GAMES.find(g => g.id === currentGame) ? 'math'
            : GRAMMAR_GAMES.find(g => g.id === currentGame) ? 'grammar'
              : VOCABULARY_GAMES.find(g => g.id === currentGame) ? 'vocabulary'
                : SKILL_GAMES.find(g => g.id === currentGame) ? 'skill'
                  : EXAM_GAMES.find(g => g.id === currentGame) ? 'exam'
                    : LQ_CHAMP_GAMES.find(g => g.id === currentGame) ? 'skill'
                    : 'comprehension';
          return <SheetBasedGame onBack={handleBackToHome} difficulty={selectedDifficulty || 'None'} settings={settings} gameId={currentGame} title={gameInfo?.title} icon={gameInfo?.icon} color={gameInfo?.color} variant={variant} />;
        }


        // Determine if we should show difficulty selector
        // Show IF: difficultyFilterEnabled is TRUE AND selectedDifficulty is NULL
        // AND settings.defaultDifficulty is 'None' (otherwise we'd have auto-selected it in handleGameSelect)
        // Actually, clearer logic:
        // If !difficultyFilterEnabled -> User skips selector. We need to ensure selectedDifficulty is set to 'None' automatically (handled below or via effect).
        // But here we are rendering.
        // If we are here, currentGame is set but selectedDifficulty is likely null.

        const shouldShowDifficulty = settings.difficultyFilterEnabled &&
          (!settings.defaultDifficulty || settings.defaultDifficulty === 'None');

        if (currentGame && !selectedDifficulty) {
          if (shouldShowDifficulty) {
            return <DifficultySelector game={currentGame} onSelect={setSelectedDifficulty} onBack={() => setCurrentGame(null)} settings={settings} />;
          } else {
            // Auto-select 'None' (All) and render immediately (by forcing re-render or just rendering the game component here)
            // Better pattern: Set state and return null (to trigger re-render) or render the game directly.
            // Since we can't easily jump back to the "if (currentGame && selectedDifficulty)" block without state update,
            // we'll update state.
            // Note: updating state during render is bad.
            // We should handle this in the selection handler or use a derived state.
          }
        }

        const handleGameSelect = (gameId: string) => {
          setCurrentGame(gameId);
          if (settings.difficultyFilterEnabled && settings.defaultDifficulty && settings.defaultDifficulty !== 'None') {
            setSelectedDifficulty(settings.defaultDifficulty);
          } else if (!settings.difficultyFilterEnabled) {
            setSelectedDifficulty('None'); // Auto-select None/All effectively
          }
        };

        const handleBrainTrainingGameSelect = (game: GameDefinition) => {
          setCurrentGame(game.id);
        };

        const handleBrainTrainingDifficultySelect = (difficulty: Difficulty) => {
          setSelectedDifficulty(difficulty);
        };

        if (currentSubject === 'english' && englishCategory) {
          const games = englishCategory === 'grammar' ? GRAMMAR_GAMES : englishCategory === 'vocabulary' ? VOCABULARY_GAMES : COMPREHENSION_GAMES;
          return <GameTilesPage title={englishCategory.charAt(0).toUpperCase() + englishCategory.slice(1)} icon={englishCategory === 'grammar' ? '✏️' : englishCategory === 'vocabulary' ? '📖' : '🔍'} games={games} onSelectGame={handleGameSelect} onBack={() => setEnglishCategory(null)} totalStars={totalStars} variant={englishCategory} surpriseMode={settings.surpriseMode} leaderboard={leaderboard} />;
        }
        if (currentSubject === 'english') return <EnglishLandingPage onSelectCategory={setEnglishCategory} onBack={handleBackToHome} totalStars={totalStars} />;
        if (currentSubject === 'math') return <GameTilesPage title="Math Galaxy" icon="🔢" games={MATH_GAMES} onSelectGame={handleGameSelect} onBack={handleBackToHome} totalStars={totalStars} variant="math" surpriseMode={settings.surpriseMode} leaderboard={leaderboard} />;
        if (currentSubject === 'braintraining') return <BrainTrainingPage onBack={handleBackToHome} onSelectGame={handleBrainTrainingGameSelect} onSelectDifficulty={handleBrainTrainingDifficultySelect} settings={settings} />;
        if (currentSubject === 'exam') return <GameTilesPage title="Exam Center" icon="📝" games={EXAM_GAMES} onSelectGame={handleGameSelect} onBack={handleBackToHome} totalStars={totalStars} variant="exam" surpriseMode={settings.surpriseMode} leaderboard={leaderboard} />;
        if (currentSubject === 'lqchamp') return <LQChampHubPage onBack={handleBackToHome} onSelectGame={handleGameSelect} totalStars={totalStars} settings={settings} leaderboard={leaderboard} />;

        return <MainLandingPage onSelectSubject={setCurrentSubject} totalStars={totalStars} onOpenLeaderboard={() => setShowLeaderboard(true)} onOpenQA={() => setShowQA(true)} onOpenSettings={() => setShowSettings(true)} leaderboard={leaderboard} settings={settings} />;
      })()}
    </Suspense>
  );
};

export default LearningGalaxy;
