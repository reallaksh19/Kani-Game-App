// Game Definitions
// Centralized configuration for all games

import { GameDefinition, Difficulty } from '../types';

export const MATH_GAMES: GameDefinition[] = [
    {
        id: 'space-math',
        title: 'Space Math',
        icon: '🚀',
        color: 'from-orange-500 to-yellow-500',
        difficulty: 'Easy',
        description: 'Solve equations!'
    },
    {
        id: 'alien-invasion',
        title: 'Alien Invasion',
        icon: '👾',
        color: 'from-green-500 to-cyan-500',
        difficulty: 'Hard',
        description: 'Zap aliens!'
    },
    {
        id: 'bubble-pop',
        title: 'Bubble Pop',
        icon: '🫧',
        color: 'from-cyan-500 to-blue-500',
        difficulty: 'Easy',
        description: 'Pop answers!'
    },
    {
        id: 'planet-hopper',
        title: 'Planet Hopper',
        icon: '🪐',
        color: 'from-purple-500 to-pink-500',
        difficulty: 'Medium',
        description: 'Complete sequences!'
    },
    {
        id: 'fraction-frenzy',
        title: 'Fraction Frenzy',
        icon: '🍕',
        color: 'from-amber-500 to-orange-500',
        difficulty: 'Medium',
        description: 'Master fractions!'
    },
    {
        id: 'time-warp',
        title: 'Time Warp',
        icon: '⏰',
        color: 'from-blue-500 to-indigo-500',
        difficulty: 'Easy',
        description: 'Tell time!'
    },
    {
        id: 'money-master',
        title: 'Money Master',
        icon: '💰',
        color: 'from-green-500 to-emerald-500',
        difficulty: 'Medium',
        description: 'Count money!'
    },
    {
        id: 'geometry-galaxy',
        title: 'Geometry Galaxy',
        icon: '📐',
        color: 'from-pink-500 to-purple-500',
        difficulty: 'Medium',
        description: 'Learn shapes!'
    },
    {
        id: 'story-solver',
        title: 'Story Solver',
        icon: '📖',
        color: 'from-violet-500 to-purple-500',
        difficulty: 'Medium',
        description: 'Word problems!'
    },
    {
        id: 'estimation-express',
        title: 'Estimation Express',
        icon: '🎯',
        color: 'from-amber-500 to-red-500',
        difficulty: 'Medium',
        description: 'Quick estimates!'
    },
    {
        id: 'pattern-planet',
        title: 'Pattern Planet',
        icon: '🔮',
        color: 'from-fuchsia-500 to-pink-500',
        difficulty: 'Easy',
        description: 'Find patterns!'
    },
    {
        id: 'measurement-mission',
        title: 'Measurement Mission',
        icon: '📏',
        color: 'from-sky-500 to-blue-500',
        difficulty: 'Medium',
        description: 'Measure it!'
    },
];

export const GRAMMAR_GAMES: GameDefinition[] = [
    {
        id: 'grammar-galaxy',
        title: 'Grammar Galaxy',
        icon: '🛸',
        color: 'from-purple-500 to-indigo-500',
        difficulty: 'Medium',
        description: 'Fix grammar!'
    },
    {
        id: 'word-class-warp',
        title: 'Word Class Warp',
        icon: '🌟',
        color: 'from-pink-500 to-purple-500',
        difficulty: 'Easy',
        description: 'Sort words!'
    },
    {
        id: 'punctuation-pop',
        title: 'Punctuation Pop',
        icon: '✨',
        color: 'from-pink-500 to-rose-500',
        difficulty: 'Easy',
        description: 'Add punctuation!'
    },
    {
        id: 'tense-traveler',
        title: 'Tense Traveler',
        icon: '⏰',
        color: 'from-emerald-500 to-teal-500',
        difficulty: 'Medium',
        description: 'Verb tenses!'
    },
    {
        id: 'sentence-builder',
        title: 'Sentence Builder',
        icon: '🏗️',
        color: 'from-cyan-500 to-teal-500',
        difficulty: 'Medium',
        description: 'Build sentences!'
    },
    {
        id: 'contraction-commander',
        title: 'Contraction Commander',
        icon: '✂️',
        color: 'from-rose-500 to-pink-500',
        difficulty: 'Easy',
        description: 'Shorten words!'
    },
    {
        id: 'article-adventure',
        title: 'Article Adventure',
        icon: '📰',
        color: 'from-lime-500 to-green-500',
        difficulty: 'Easy',
        description: 'A, an, or the?'
    }
];

export const VOCABULARY_GAMES: GameDefinition[] = [
    {
        id: 'synonym-stars',
        title: 'Synonym Stars',
        icon: '⭐',
        color: 'from-yellow-500 to-orange-500',
        difficulty: 'Easy',
        description: 'Find synonyms!'
    },
    {
        id: 'antonym-asteroids',
        title: 'Antonym Asteroids',
        icon: '☄️',
        color: 'from-red-500 to-orange-500',
        difficulty: 'Easy',
        description: 'Find opposites!'
    },
    {
        id: 'word-wizard',
        title: 'Word Wizard',
        icon: '🧙',
        color: 'from-indigo-500 to-blue-500',
        difficulty: 'Medium',
        description: 'Guess from clues!'
    },
    {
        id: 'root-raider',
        title: 'Root Raider',
        icon: '🌳',
        color: 'from-green-600 to-teal-500',
        difficulty: 'Hard',
        description: 'Word roots!'
    },
    {
        id: 'idiom-island',
        title: 'Idiom Island',
        icon: '🏝️',
        color: 'from-orange-500 to-yellow-400',
        difficulty: 'Medium',
        description: 'Figure of speech!'
    },
    {
        id: 'homophone-hunt',
        title: 'Homophone Hunt',
        icon: '👂',
        color: 'from-pink-500 to-red-400',
        difficulty: 'Easy',
        description: 'Sound-alike words!'
    }
];

export const COMPREHENSION_GAMES: GameDefinition[] = [
    {
        id: 'story-nebula',
        title: 'Story Nebula',
        icon: '📖',
        color: 'from-indigo-500 to-purple-500',
        difficulty: 'Medium',
        description: 'Read stories!'
    },
    {
        id: 'inference-investigator',
        title: 'Inference Investigator',
        icon: '🔍',
        color: 'from-violet-500 to-purple-500',
        difficulty: 'Hard',
        description: 'Make inferences!'
    },
    {
        id: 'spyglass-explorer',
        title: 'Spyglass Explorer',
        icon: '🕵️',
        color: 'from-teal-600 to-emerald-600',
        difficulty: 'Medium',
        description: 'Observe & Recall!'
    },
    {
        id: 'story-jammer',
        title: 'Story Jammer',
        icon: '📚',
        color: 'from-blue-600 to-indigo-600',
        difficulty: 'Medium',
        description: 'Advanced Comprehension!'
    },
];

// Brain Training / Skill Games - Phase 1 & 2
export const SKILL_GAMES: GameDefinition[] = [
    {
        id: 'pattern-forge',
        title: 'Pattern Forge',
        icon: '🧩',
        color: 'from-violet-500 to-indigo-500',
        difficulty: 'Easy',
        description: 'Complete patterns!'
    },
    {
        id: 'logic-lab',
        title: 'Logic Lab',
        icon: '🔍',
        color: 'from-emerald-500 to-teal-500',
        difficulty: 'Medium',
        description: 'Solve puzzles!'
    },
    {
        id: 'odd-wizard',
        title: 'Odd Wizard',
        icon: '🎯',
        color: 'from-amber-500 to-yellow-500',
        difficulty: 'Easy',
        description: 'Find the odd one!'
    },
    {
        id: 'sorting-station',
        title: 'Sorting Station',
        icon: '📦',
        color: 'from-blue-500 to-cyan-500',
        difficulty: 'Easy',
        description: 'Put in order!'
    },
    {
        id: 'code-breaker',
        title: 'Code Breaker',
        icon: '🔐',
        color: 'from-purple-500 to-fuchsia-500',
        difficulty: 'Medium',
        description: 'Crack codes!'
    },
    // Phase 3 - Interactive Games
    {
        id: 'memory-matrix',
        title: 'Memory Matrix',
        icon: '🧠',
        color: 'from-pink-500 to-rose-500',
        difficulty: 'Easy',
        description: 'Remember patterns!'
    },
    {
        id: 'sequence-sprint',
        title: 'Sequence Sprint',
        icon: '🃏',
        color: 'from-orange-500 to-red-500',
        difficulty: 'Easy',
        description: 'Recall sequences!'
    },
    {
        id: 'path-planner',
        title: 'Path Planner',
        icon: '🤖',
        color: 'from-green-500 to-lime-500',
        difficulty: 'Medium',
        description: 'Guide the robot!'
    },
    // Phase 4 - Advanced Games
    {
        id: 'data-detective',
        title: 'Data Detective',
        icon: '📊',
        color: 'from-cyan-500 to-blue-500',
        difficulty: 'Medium',
        description: 'Read the charts!'
    },
    {
        id: 'venn-voyager',
        title: 'Venn Voyager',
        icon: '⭕',
        color: 'from-fuchsia-500 to-pink-500',
        difficulty: 'Hard',
        description: 'Sort the items!'
    },
    {
        id: 'mirror-match',
        title: 'Mirror Match',
        icon: '🪞',
        color: 'from-teal-500 to-emerald-500',
        difficulty: 'Easy',
        description: 'Find the reflection!'
    },
    {
        id: 'scale-sense',
        title: 'Scale Sense',
        icon: '⚖️',
        color: 'from-amber-500 to-orange-500',
        difficulty: 'Medium',
        description: 'Balance the scale!'
    },
    // Phase 5 - Analytical Skills Games
    {
        id: 'cause-effect',
        title: 'Cause & Effect',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
        difficulty: 'Medium',
        description: 'Why did it happen?'
    },
    {
        id: 'analogy-arena',
        title: 'Analogy Arena',
        icon: '🔗',
        color: 'from-indigo-500 to-violet-500',
        difficulty: 'Medium',
        description: 'Find the pattern!'
    },
    {
        id: 'sequence-story',
        title: 'Sequence Story',
        icon: '📝',
        color: 'from-teal-500 to-cyan-500',
        difficulty: 'Easy',
        description: 'What comes next?'
    },
    {
        id: 'classify-quest',
        title: 'Classify Quest',
        icon: '📊',
        color: 'from-rose-500 to-red-500',
        difficulty: 'Easy',
        description: 'Sort them out!'
    }
];

// Exam Games
export const EXAM_GAMES: GameDefinition[] = [
    {
        id: 'fraction-exam',
        title: 'Fraction Exam',
        icon: '📝',
        color: 'from-blue-600 to-indigo-700',
        difficulty: 'Medium',
        description: 'Test your knowledge!'
    }
];

// LogIQids (LQ Champ) Olympiad Practice Lots
export const LQ_CHAMP_GAMES: GameDefinition[] = [
    {
        id: 'lq-lot-1',
        title: 'LQ Champ - Lot 1',
        icon: '🏆',
        color: 'from-amber-500 via-orange-500 to-red-500',
        difficulty: 'Medium',
        description: '15 Medium & 5 Hard Aptitude Questions!'
    },
    {
        id: 'lq-lot-2',
        title: 'LQ Champ - Lot 2',
        icon: '⚡',
        color: 'from-purple-500 via-indigo-500 to-blue-500',
        difficulty: 'Medium',
        description: 'Coming Soon - Lot 2'
    },
    {
        id: 'lq-lot-3',
        title: 'LQ Champ - Lot 3',
        icon: '🧠',
        color: 'from-emerald-500 via-teal-500 to-cyan-500',
        difficulty: 'Medium',
        description: 'Coming Soon - Lot 3'
    },
    {
        id: 'lq-lot-4',
        title: 'LQ Champ - Lot 4',
        icon: '🎯',
        color: 'from-pink-500 via-rose-500 to-red-500',
        difficulty: 'Medium',
        description: 'Coming Soon - Lot 4'
    },
    {
        id: 'lq-lot-5',
        title: 'LQ Champ - Lot 5',
        icon: '🌟',
        color: 'from-blue-600 via-indigo-600 to-violet-700',
        difficulty: 'Hard',
        description: 'Coming Soon - Lot 5'
    }
];

export const ALL_GAMES: GameDefinition[] = [
    ...MATH_GAMES,
    ...GRAMMAR_GAMES,
    ...VOCABULARY_GAMES,
    ...COMPREHENSION_GAMES,
    ...SKILL_GAMES,
    ...EXAM_GAMES,
    ...LQ_CHAMP_GAMES
];

export const DEFAULT_SETTINGS = {
    mathSheetUrl: 'MATH_GOOGLE_SHEET_DATA.csv',
    englishSheetUrl: 'ENGLISH_GOOGLE_SHEET_DATA.csv',
    skillSheetUrl: 'SKILL_GAMES_DATA.csv',
    examSheetUrl: 'fraction-exam.csv',
    topicSheetUrl: '',
    selectedTopics: '',
    selectedSubtopics: '',
    selectedMathWorksheet: '1',
    selectedEnglishWorksheet: '1',
    defaultDifficulty: 'None' as Difficulty,
    difficultyFilterEnabled: false,
    soundEnabled: true,
    randomize: false,
    kidMode: false,
    leaderboardUrl: '',
    settingsSheetUrl: '',
    enabledGames: {
        'fraction-frenzy': true,
        'grammar-galaxy': true,
        'tense-traveler': true,
        'punctuation-pop': true,
        'story-nebula': true,
        'story-jammer': true,
        'fraction-exam': true,
        'lq-lot-1': true
    },
    generatorGrade: 'Grade 3',
    generatorDifficulty: 'Easy',
    levelUpMode: false,
    surpriseMode: false,
    enabledMasterTiles: {
        'math': true,
        'english': true,
        'braintraining': true,
        'exam': false,
        'lqchamp': true
    },
    disableAnalyticsInProduction: true
};

export default {
    MATH_GAMES,
    GRAMMAR_GAMES,
    VOCABULARY_GAMES,
    COMPREHENSION_GAMES,
    SKILL_GAMES,
    EXAM_GAMES,
    LQ_CHAMP_GAMES,
    ALL_GAMES,
    DEFAULT_SETTINGS,
};
