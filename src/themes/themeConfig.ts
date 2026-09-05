// Theme Configuration for Learning Galaxy
// Centralized colors, gradients, and visual styling

export const THEME_COLORS = {
  // Subject themes
  math: {
    primary: '#4a2c7a',
    secondary: '#2d1b4e',
    background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 50%, #4a2c7a 100%)',
    accent: '#fbbf24',
  },
  english: {
    primary: '#2d5a87',
    secondary: '#1e3a5f',
    background: 'linear-gradient(180deg, #0a1628 0%, #1e3a5f 50%, #2d5a87 100%)',
    accent: '#60a5fa',
  },
  grammar: {
    primary: '#4a3c7a',
    secondary: '#2e1f5e',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #2e1f5e 50%, #4a3c7a 100%)',
    accent: '#a78bfa',
  },
  vocabulary: {
    primary: '#3a6a3a',
    secondary: '#2e4e2e',
    background: 'linear-gradient(180deg, #1a2a1a 0%, #2e4e2e 50%, #3a6a3a 100%)',
    accent: '#4ade80',
  },
  comprehension: {
    primary: '#2d6a6a',
    secondary: '#1e4a4a',
    background: 'linear-gradient(180deg, #0a2020 0%, #1e4a4a 50%, #2d6a6a 100%)',
    accent: '#22d3ee',
  },
  default: {
    primary: '#4a2c7a',
    secondary: '#2d1b4e',
    background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 50%, #4a2c7a 100%)',
    accent: '#fbbf24',
  },
};

export interface GameTheme {
  gradient: string;
  buttonBg: string;
  cardBg: string;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  storyTitleColor?: string;
  questionBg?: string;
  magnifyingGlass?: string;
}

// Game-specific color schemes with unique styling per game
export const GAME_THEMES: Record<string, GameTheme> = {
  'story-jammer': {
    gradient: 'from-blue-600 to-indigo-600',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    cardBg: 'bg-blue-900/40',
    accentColor: 'text-blue-300',
    borderColor: 'border-blue-400',
    glowColor: 'shadow-blue-500/50',
    storyTitleColor: 'text-yellow-300',
    questionBg: 'bg-blue-800/60',
  },
  // Math games
  'space-math': {
    gradient: 'from-orange-500 to-yellow-500',
    buttonBg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
    cardBg: 'bg-orange-900/30',
    accentColor: 'text-orange-400',
    borderColor: 'border-orange-500',
    glowColor: 'shadow-orange-500/50',
  },
  'alien-invasion': {
    gradient: 'from-green-500 to-cyan-500',
    buttonBg: 'bg-gradient-to-r from-green-500 to-cyan-500',
    cardBg: 'bg-green-900/30',
    accentColor: 'text-green-400',
    borderColor: 'border-green-500',
    glowColor: 'shadow-green-500/50',
  },
  'bubble-pop': {
    gradient: 'from-cyan-500 to-blue-500',
    buttonBg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    cardBg: 'bg-cyan-900/30',
    accentColor: 'text-cyan-400',
    borderColor: 'border-cyan-500',
    glowColor: 'shadow-cyan-500/50',
  },
  'planet-hopper': {
    gradient: 'from-purple-500 to-pink-500',
    buttonBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    cardBg: 'bg-purple-900/30',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/50',
  },
  'fraction-frenzy': {
    gradient: 'from-amber-500 to-orange-500',
    buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    cardBg: 'bg-amber-900/30',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500',
    glowColor: 'shadow-amber-500/50',
  },
  'time-warp': {
    gradient: 'from-blue-500 to-indigo-500',
    buttonBg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    cardBg: 'bg-blue-900/30',
    accentColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    glowColor: 'shadow-blue-500/50',
  },
  'money-master': {
    gradient: 'from-green-500 to-emerald-500',
    buttonBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    cardBg: 'bg-emerald-900/30',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    glowColor: 'shadow-emerald-500/50',
  },
  'geometry-galaxy': {
    gradient: 'from-pink-500 to-purple-500',
    buttonBg: 'bg-gradient-to-r from-pink-500 to-purple-500',
    cardBg: 'bg-pink-900/30',
    accentColor: 'text-pink-400',
    borderColor: 'border-pink-500',
    glowColor: 'shadow-pink-500/50',
  },

  // Grammar games
  'grammar-galaxy': {
    gradient: 'from-purple-500 to-indigo-500',
    buttonBg: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    cardBg: 'bg-indigo-900/30',
    accentColor: 'text-indigo-400',
    borderColor: 'border-indigo-500',
    glowColor: 'shadow-indigo-500/50',
  },
  'word-class-warp': {
    gradient: 'from-pink-500 to-purple-500',
    buttonBg: 'bg-gradient-to-r from-pink-500 to-purple-500',
    cardBg: 'bg-purple-900/30',
    accentColor: 'text-pink-400',
    borderColor: 'border-pink-500',
    glowColor: 'shadow-pink-500/50',
  },
  'punctuation-pop': {
    gradient: 'from-pink-500 to-rose-500',
    buttonBg: 'bg-gradient-to-b from-pink-400 to-rose-500',
    cardBg: 'bg-rose-900/30',
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500',
    glowColor: 'shadow-rose-500/50',
  },
  'tense-traveler': {
    gradient: 'from-emerald-500 to-teal-500',
    buttonBg: 'bg-gradient-to-r from-teal-600 to-emerald-600',
    cardBg: 'bg-teal-900/30',
    accentColor: 'text-teal-400',
    borderColor: 'border-teal-500',
    glowColor: 'shadow-teal-500/50',
  },
  'sentence-builder': {
    gradient: 'from-cyan-500 to-teal-500',
    buttonBg: 'bg-gradient-to-r from-cyan-500 to-teal-500',
    cardBg: 'bg-cyan-900/30',
    accentColor: 'text-cyan-300',
    borderColor: 'border-cyan-400',
    glowColor: 'shadow-cyan-500/50',
  },
  'contraction-commander': {
    gradient: 'from-rose-500 to-pink-500',
    buttonBg: 'bg-gradient-to-r from-rose-500 to-pink-500',
    cardBg: 'bg-rose-900/30',
    accentColor: 'text-rose-300',
    borderColor: 'border-rose-400',
    glowColor: 'shadow-rose-500/50',
  },
  'article-adventure': {
    gradient: 'from-lime-500 to-green-500',
    buttonBg: 'bg-gradient-to-r from-lime-500 to-green-500',
    cardBg: 'bg-lime-900/30',
    accentColor: 'text-lime-300',
    borderColor: 'border-lime-400',
    glowColor: 'shadow-lime-500/50',
  },

  // Vocabulary games
  'synonym-stars': {
    gradient: 'from-yellow-500 to-orange-500',
    buttonBg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    cardBg: 'bg-yellow-900/30',
    accentColor: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-yellow-500/50',
  },
  'antonym-asteroids': {
    gradient: 'from-red-500 to-orange-500',
    buttonBg: 'bg-gradient-to-r from-red-500 to-orange-500',
    cardBg: 'bg-red-900/30',
    accentColor: 'text-red-400',
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/50',
  },

  // Comprehension games - Enhanced with unique themes
  'story-nebula': {
    gradient: 'from-indigo-500 to-purple-500',
    buttonBg: 'bg-gradient-to-r from-teal-600 to-cyan-600',
    cardBg: 'bg-gradient-to-br from-teal-900/40 to-cyan-900/40',
    accentColor: 'text-teal-300',
    borderColor: 'border-teal-400',
    glowColor: 'shadow-teal-500/50',
    storyTitleColor: 'text-yellow-300',
    questionBg: 'bg-teal-800/60',
  },
  'inference-investigator': {
    gradient: 'from-violet-500 to-purple-500',
    buttonBg: 'bg-gradient-to-r from-violet-600 to-purple-600',
    cardBg: 'bg-gradient-to-br from-violet-900/40 to-purple-900/40',
    accentColor: 'text-violet-300',
    borderColor: 'border-violet-400',
    glowColor: 'shadow-violet-500/50',
    magnifyingGlass: '🔎',
    questionBg: 'bg-violet-800/60',
  },
  'spyglass-explorer': {
    gradient: 'from-teal-600 to-emerald-600',
    buttonBg: 'bg-gradient-to-r from-teal-600 to-emerald-600',
    cardBg: 'bg-teal-900/40',
    accentColor: 'text-teal-300',
    borderColor: 'border-teal-400',
    glowColor: 'shadow-teal-500/50',
    magnifyingGlass: '🕵️',
    questionBg: 'bg-teal-800/60',
  },
  // Skill games
  'pattern-forge': {
    gradient: 'from-violet-500 to-indigo-500',
    buttonBg: 'bg-gradient-to-r from-violet-500 to-indigo-500',
    cardBg: 'bg-violet-900/30',
    accentColor: 'text-violet-400',
    borderColor: 'border-violet-500',
    glowColor: 'shadow-violet-500/50',
  },
  'logic-lab': {
    gradient: 'from-emerald-500 to-teal-500',
    buttonBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    cardBg: 'bg-emerald-900/30',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    glowColor: 'shadow-emerald-500/50',
  },
  'odd-wizard': {
    gradient: 'from-amber-500 to-yellow-500',
    buttonBg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    cardBg: 'bg-amber-900/30',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500',
    glowColor: 'shadow-amber-500/50',
  },
  'sorting-station': {
    gradient: 'from-blue-500 to-cyan-500',
    buttonBg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    cardBg: 'bg-blue-900/30',
    accentColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    glowColor: 'shadow-blue-500/50',
  },
  'code-breaker': {
    gradient: 'from-purple-500 to-fuchsia-500',
    buttonBg: 'bg-gradient-to-r from-purple-500 to-fuchsia-500',
    cardBg: 'bg-purple-900/30',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/50',
  },
  // Phase 5 Games
  'cause-effect': {
    gradient: 'from-yellow-500 to-orange-500',
    buttonBg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    cardBg: 'bg-yellow-900/30',
    accentColor: 'text-yellow-300',
    borderColor: 'border-yellow-400',
    glowColor: 'shadow-yellow-500/50',
  },
  'analogy-arena': {
    gradient: 'from-indigo-500 to-violet-500',
    buttonBg: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    cardBg: 'bg-indigo-900/30',
    accentColor: 'text-indigo-300',
    borderColor: 'border-indigo-400',
    glowColor: 'shadow-indigo-500/50',
  },
  'sequence-story': {
    gradient: 'from-teal-500 to-cyan-500',
    buttonBg: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    cardBg: 'bg-teal-900/30',
    accentColor: 'text-teal-300',
    borderColor: 'border-teal-400',
    glowColor: 'shadow-teal-500/50',
  },
  'classify-quest': {
    gradient: 'from-rose-500 to-red-500',
    buttonBg: 'bg-gradient-to-r from-rose-500 to-red-500',
    cardBg: 'bg-rose-900/30',
    accentColor: 'text-rose-300',
    borderColor: 'border-rose-400',
    glowColor: 'shadow-rose-500/50',
  },
  // Exam Games
  'fraction-exam': {
    gradient: 'from-blue-600 to-indigo-700',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-700',
    cardBg: 'bg-blue-900/30',
    accentColor: 'text-blue-300',
    borderColor: 'border-blue-500',
    glowColor: 'shadow-blue-500/50',
  },
  // LQ Champ Games
  'lq-lot-1': {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    buttonBg: 'bg-gradient-to-r from-amber-600 to-orange-600',
    cardBg: 'bg-amber-950/40',
    accentColor: 'text-amber-300',
    borderColor: 'border-amber-500',
    glowColor: 'shadow-amber-500/50',
  },
  'lq-lot-2': {
    gradient: 'from-purple-500 via-indigo-500 to-blue-500',
    buttonBg: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    cardBg: 'bg-purple-950/40',
    accentColor: 'text-purple-300',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/50',
  },
  'lq-lot-3': {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    cardBg: 'bg-emerald-950/40',
    accentColor: 'text-emerald-300',
    borderColor: 'border-emerald-500',
    glowColor: 'shadow-emerald-500/50',
  },
  'lq-lot-4': {
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    buttonBg: 'bg-gradient-to-r from-pink-600 to-rose-600',
    cardBg: 'bg-rose-950/40',
    accentColor: 'text-rose-300',
    borderColor: 'border-rose-500',
    glowColor: 'shadow-rose-500/50',
  },
  'lq-lot-5': {
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-violet-600',
    cardBg: 'bg-indigo-950/40',
    accentColor: 'text-violet-300',
    borderColor: 'border-violet-500',
    glowColor: 'shadow-violet-500/50',
  },
};

// Icon library
export const ICONS = {
  games: {
    'space-math': '🚀',
    'alien-invasion': '👾',
    'bubble-pop': '🫧',
    'planet-hopper': '🪐',
    'fraction-frenzy': '🍕',
    'time-warp': '⏰',
    'money-master': '💰',
    'geometry-galaxy': '📐',
    'grammar-galaxy': '🛸',
    'word-class-warp': '🌟',
    'punctuation-pop': '✨',
    'tense-traveler': '⏰',
    'synonym-stars': '⭐',
    'antonym-asteroids': '☄️',
    'story-nebula': '📖',
    'inference-investigator': '🔍',
    'spyglass-explorer': '🕵️',
    'pattern-forge': '🧩',
    'logic-lab': '🧠',
    'odd-wizard': '🧙',
    'sorting-station': '🗄️',
    'code-breaker': '🔐',
    'fraction-exam': '📝',
    'lq-lot-1': '🏆',
    'lq-lot-2': '⚡',
    'lq-lot-3': '🧠',
    'lq-lot-4': '🎯',
    'lq-lot-5': '🌟',
  },
  wordClass: {
    noun: '📦',
    verb: '🏃',
    adjective: '🎨',
    adverb: '⚡',
  },
  tense: {
    past: '⏪',
    present: '▶️',
    future: '⏩',
  },
  ui: {
    star: '⭐',
    settings: '⚙️',
    back: '←',
    home: '🏠',
    leaderboard: '🏆',
    analytics: '📊',
    lock: '🔒',
    save: '💾',
    reset: '🔄',
  },
  subjects: {
    math: '🔢',
    english: '📚',
    grammar: '✏️',
    vocabulary: '📖',
    comprehension: '🔍',
  },
  decorative: {
    rocket: '🚀',
    star: '⭐',
    earth: '🌍',
    spaceship: '🛸',
    sparkle: '💫',
    glowStar: '🌟',
  },
};

// Difficulty color schemes
export const DIFFICULTY_COLORS = {
  Easy: {
    bg: 'bg-green-500',
    text: 'text-green-400',
    border: 'border-green-500',
    gradient: 'from-green-500 to-green-600',
  },
  Medium: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-400',
    border: 'border-yellow-500',
    gradient: 'from-yellow-500 to-orange-500',
  },
  Hard: {
    bg: 'bg-red-500',
    text: 'text-red-400',
    border: 'border-red-500',
    gradient: 'from-red-500 to-red-600',
  },
};

// Typography configuration
export const TYPOGRAPHY = {
  headings: {
    h1: 'text-4xl md:text-5xl font-bold',
    h2: 'text-3xl md:text-4xl font-bold',
    h3: 'text-2xl md:text-3xl font-bold',
    h4: 'text-xl md:text-2xl font-bold',
  },
  body: {
    large: 'text-lg md:text-xl',
    medium: 'text-base md:text-lg',
    small: 'text-sm md:text-base',
    tiny: 'text-xs md:text-sm',
  },
  question: {
    title: 'text-2xl md:text-4xl font-bold',
    description: 'text-sm md:text-base',
    option: 'text-lg md:text-2xl font-bold',
  },
};

export const ANIMATIONS = {
  float: 'animate-float',
  slideIn: 'animate-slideIn',
  pulse: 'animate-pulse',
  twinkle: 'animate-twinkle',
};

export default {
  THEME_COLORS,
  GAME_THEMES,
  ICONS,
  DIFFICULTY_COLORS,
  TYPOGRAPHY,
  ANIMATIONS,
};
