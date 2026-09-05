import { useState, useEffect, useCallback } from 'react';
import { Difficulty, Settings, Question, Feedback } from '../types';
import { useSheetData } from './useSheetData';
import { GAME_CONSTANTS } from '../constants/gameConstants';
import { orderItems, pickOrderedItem } from '../utils/questionOrder';

export const useGameLogic = (
    gameId: string,
    difficulty: Difficulty,
    settings: Settings,
    onGameEnd: (game: string, name: string, stars: number, streak: number, hintsUsed: number) => Promise<void>
) => {
    const isMath = ['space-math', 'alien-invasion', 'bubble-pop', 'planet-hopper', 'fraction-frenzy', 'time-warp', 'money-master', 'geometry-galaxy', 'story-solver', 'estimation-express', 'pattern-planet', 'measurement-mission', 'fraction-exam'].includes(gameId);
    const isSkill = ['pattern-forge', 'logic-lab', 'odd-wizard', 'sorting-station', 'code-breaker', 'memory-matrix', 'sequence-sprint', 'path-planner', 'data-detective', 'venn-voyager', 'mirror-match', 'scale-sense', 'cause-effect', 'analogy-arena', 'sequence-story', 'classify-quest', 'lq-lot-1', 'lq-lot-2', 'lq-lot-3', 'lq-lot-4', 'lq-lot-5'].includes(gameId);
    const isLQ = gameId.startsWith('lq-lot-');

    const getSheetUrl = () => {
        if (isLQ) {
            const lotNum = gameId.replace('lq-lot-', '');
            return `${import.meta.env.BASE_URL}docs/questions/lq-champ/lot-${lotNum}.csv`;
        }
        if (settings.useGoogleSheets) {
            return isMath ? settings.mathSheetUrl : isSkill ? (settings.skillSheetUrl || settings.englishSheetUrl) : settings.englishSheetUrl;
        }
        return `${import.meta.env.BASE_URL}games/${gameId}.csv`;
    };

    const sheetUrl = getSheetUrl();
    const { data: allQuestions, loading, error } = useSheetData(sheetUrl, gameId);

    const [stars, setStars] = useState(0);
    const [timer, setTimer] = useState(0);
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [currentQ, setCurrentQ] = useState<Question | null>(null);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [scoreSaved, setScoreSaved] = useState(false);
    const [questionsQueue, setQuestionsQueue] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [answers, setAnswers] = useState<Record<number, { selected: string, isCorrect: boolean, timeSpent?: number }>>({});
    const [hintLogs, setHintLogs] = useState<Record<number, boolean>>({});
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

    const filterQuestions = useCallback(() => {
        // A Grade 4 LQ lot is intentionally mixed: 15 Medium + 5 Hard.
        // Never let the app-wide difficulty filter silently remove part of a lot.
        if (isLQ) return allQuestions;
        return allQuestions.filter(q => !q.difficulty || q.difficulty === difficulty || difficulty === 'None');
    }, [allQuestions, difficulty, isLQ]);

    useEffect(() => {
        if (gameActive && !gameOver) {
            const interval = setInterval(() => setTimer(t => t + 1), 1000);
            return () => clearInterval(interval);
        }
    }, [gameActive, gameOver]);

    const startGame = () => {
        setStars(0);
        setTimer(0);
        setStreak(0);
        setMaxStreak(0);
        setGameActive(true);
        setGameOver(false);
        setScoreSaved(false);
        setPlayerName('');
        setAnswers({});
        setHintLogs({});
        setFeedback(null);
        setQuestionStartTime(Date.now());

        const filtered = filterQuestions();
        let session: Question[] = [];

        if (gameId === 'story-nebula' || gameId === 'story-jammer') {
            const grouped: Record<string, Question[]> = {};
            filtered.forEach(q => {
                const key = (gameId === 'story-jammer' ? q.story_id : q.text1) || 'Untitled';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(q);
            });

            const keys = Object.keys(grouped);
            const selectedKey = pickOrderedItem(keys, settings.randomize);
            if (selectedKey) {
                session = [...grouped[selectedKey]];
                if (gameId === 'story-jammer') {
                    // Questions within one passage stay in authored question-number order.
                    session.sort((a, b) => {
                        const numA = parseInt(a.question_num || '0');
                        const numB = parseInt(b.question_num || '0');
                        return numA - numB;
                    });
                }
            }
        } else {
            const ordered = orderItems(filtered, settings.randomize);
            const isExam = ['fraction-exam'].includes(gameId);
            const questionLimit = isExam ? 25 : isLQ ? 20 : 10;
            session = ordered.slice(0, questionLimit);
        }

        setQuestionsQueue(session);
        setTotalQuestions(session.length);
        setCurrentIndex(0);

        if (session.length > 0) {
            setCurrentQ(session[0]);
        } else {
            setGameActive(false);
        }
    };

    const handleAnswer = (selected: string, correct?: string) => {
        if (!gameActive || answers[currentIndex]) return;

        const isCorrect = selected === correct || selected === String(correct);
        const elapsedSec = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));

        setAnswers(prev => ({
            ...prev,
            [currentIndex]: { selected, isCorrect, timeSpent: elapsedSec }
        }));

        if (isCorrect) {
            // LQ lots contain both Medium and Hard questions in the same run, so score
            // against the actual question difficulty rather than the global selector.
            const questionDifficulty = (currentQ?.difficulty || difficulty) as Difficulty;
            const mult = questionDifficulty === 'Hard'
                ? GAME_CONSTANTS.SCORE.MULTIPLIER.HARD
                : questionDifficulty === 'Medium'
                    ? GAME_CONSTANTS.SCORE.MULTIPLIER.MEDIUM
                    : GAME_CONSTANTS.SCORE.MULTIPLIER.EASY;
            setStars(s => s + Math.floor((GAME_CONSTANTS.SCORE.BASE_POINTS + streak * GAME_CONSTANTS.SCORE.STREAK_BONUS) * mult));
            setStreak(s => { const n = s + 1; setMaxStreak(m => Math.max(m, n)); return n; });
            setFeedback({ correct: true, explanation: currentQ?.explanation });
        } else {
            setStreak(0);
            setFeedback({ correct: false, answer: correct, explanation: currentQ?.explanation });
        }
    };

    const navigateQuestion = (direction: 'next' | 'prev') => {
        let newIndex = currentIndex;
        if (direction === 'next') newIndex++;
        else newIndex--;

        if (newIndex >= 0 && newIndex < questionsQueue.length) {
            setCurrentIndex(newIndex);
            setCurrentQ(questionsQueue[newIndex]);
            setFeedback(null);
            setQuestionStartTime(Date.now());
        } else if (direction === 'next' && newIndex >= questionsQueue.length) {
            setGameActive(false);
            setGameOver(true);
        }
    };

    const toggleHint = () => {
        if (!hintLogs[currentIndex]) {
            setHintLogs(prev => ({ ...prev, [currentIndex]: true }));
        }
        return true;
    };

    const handleSaveScore = async () => {
        if (!playerName.trim()) return;
        const hintsUsed = Object.values(hintLogs).filter(Boolean).length;
        await onGameEnd(gameId, playerName, stars, maxStreak, hintsUsed);
        setScoreSaved(true);
    };

    return {
        gameState: {
            stars,
            timer,
            gameActive,
            gameOver,
            currentQ,
            questionsQueue,
            streak,
            maxStreak,
            feedback,
            playerName,
            scoreSaved,
            currentIndex,
            totalQuestions,
            answers,
            hintLogs,
            totalHintsUsed: Object.values(hintLogs).filter(Boolean).length
        },
        setters: {
            setPlayerName
        },
        actions: {
            startGame,
            handleAnswer,
            handleSaveScore,
            navigateQuestion,
            toggleHint
        },
        data: {
            loading,
            error,
            questionsCount: filterQuestions().length
        }
    };
};
