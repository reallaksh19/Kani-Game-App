# Future Development Roadmap

**Learning Galaxy App - Strategic Development Plan**
**Created**: January 23, 2026
**Timeline**: 3-6 months for complete implementation

---

## Overview

This roadmap outlines recommended improvements, new features, and technical enhancements to transform Learning Galaxy from a solid educational game into a professional-grade learning platform.

### Development Phases

1. **Phase 1: Production Readiness** (1 week) - CRITICAL
2. **Phase 2: Type Safety & Architecture** (1-2 weeks) - HIGH
3. **Phase 3: Enhanced Features** (2-4 weeks) - MEDIUM
4. **Phase 4: Polish & Scale** (2-3 weeks) - ONGOING
5. **Phase 5: Platform Expansion** (4-6 weeks) - FUTURE

---

## Phase 1: Production Readiness (1 Week)

### Goal
Make the app production-deployable with optimized builds and basic quality assurance.

### Tasks

#### 1.1 Implement Vite Build System ⭐ CRITICAL
**Priority**: CRITICAL
**Time**: 2-3 hours
**Complexity**: Low

**Current Problem**:
- Tailwind CDN loads entire 3MB library
- In-browser Babel transpilation (development only)
- No tree-shaking or minification
- Slow initial load time (2-3 seconds)

**Implementation Steps**:

```bash
# 1. Initialize Vite
npm create vite@latest . -- --template react
npm install

# 2. Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Install dependencies
npm install react react-dom
```

**Configure Tailwind** (`tailwind.config.js`):
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./learning-galaxy-v5.jsx"
  ],
  theme: {
    extend: {
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        slideIn: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' }
        }
      },
      animation: {
        twinkle: 'twinkle 3s ease-in-out infinite',
        float: 'float 2s ease-in-out infinite',
        slideIn: 'slideIn 0.3s ease-out both',
        shake: 'shake 0.3s ease-in-out'
      }
    }
  },
  plugins: []
};
```

**Create Entry Point** (`src/main.jsx`):
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../learning-galaxy-v5.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Create Styles** (`src/index.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom scrollbar for comprehension games */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
```

**Update package.json**:
```json
{
  "name": "learning-galaxy",
  "version": "5.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Expected Results**:
- Bundle size: ~50KB (vs. 3MB CDN)
- Build time: <5 seconds
- Initial load: <500ms
- Tree-shaken CSS (only used classes)

---

#### 1.2 Add Testing Suite ⭐ HIGH
**Priority**: HIGH
**Time**: 2 days
**Complexity**: Medium

**Install Dependencies**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Configure Vitest** (`vite.config.js`):
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  }
});
```

**Test Setup** (`src/test/setup.js`):
```javascript
import '@testing-library/jest-dom';
```

**Example Tests**:

**Test 1: DifficultyBadge** (`src/components/shared/DifficultyBadge.test.jsx`):
```javascript
import { render, screen } from '@testing-library/react';
import { DifficultyBadge } from './DifficultyBadge';

describe('DifficultyBadge', () => {
  test('renders Easy with green background', () => {
    render(<DifficultyBadge difficulty="Easy" />);
    const badge = screen.getByText('Easy');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-500');
  });

  test('renders Medium with yellow background', () => {
    render(<DifficultyBadge difficulty="Medium" />);
    expect(screen.getByText('Medium')).toHaveClass('bg-yellow-500');
  });

  test('renders Hard with red background', () => {
    render(<DifficultyBadge difficulty="Hard" />);
    expect(screen.getByText('Hard')).toHaveClass('bg-red-500');
  });
});
```

**Test 2: csvParser** (`src/utils/csvParser.test.js`):
```javascript
import { parseCSV } from './csvParser';

describe('csvParser', () => {
  test('parses simple CSV', () => {
    const csv = 'name,age\nJohn,30\nJane,25';
    const result = parseCSV(csv);
    expect(result).toEqual([
      { name: 'John', age: '30' },
      { name: 'Jane', age: '25' }
    ]);
  });

  test('handles quoted fields with commas', () => {
    const csv = 'question,answer\n"What is 2+2?","4"\n"What is 3,000+1?","3,001"';
    const result = parseCSV(csv);
    expect(result[1].question).toBe('What is 3,000+1?');
    expect(result[1].answer).toBe('3,001');
  });

  test('handles empty lines', () => {
    const csv = 'name\nJohn\n\nJane';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });
});
```

**Test 3: storage utility** (`src/utils/storage.test.js`):
```javascript
import { storage } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('sets and gets data', async () => {
    await storage.set('test-key', 'test-value');
    const value = await storage.get('test-key');
    expect(value).toBe('test-value');
  });

  test('returns null for missing keys', async () => {
    const value = await storage.get('non-existent');
    expect(value).toBeNull();
  });

  test('handles JSON data', async () => {
    const data = { name: 'John', score: 100 };
    await storage.set('user', JSON.stringify(data));
    const retrieved = JSON.parse(await storage.get('user'));
    expect(retrieved).toEqual(data);
  });
});
```

**Update package.json**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Target Coverage**:
- Utilities: 80%
- Shared components: 70%
- Hooks: 60%
- Overall: 40-50%

---

#### 1.3 Performance Optimizations ⭐ MEDIUM
**Priority**: MEDIUM
**Time**: 4 hours
**Complexity**: Low

**1. Memoize Pure Components**:

```javascript
// StarIcon.jsx
import { memo } from 'react';

export const StarIcon = memo(({ className = 'w-5 h-5' }) => (
  <svg className={className} /* ... */>
    {/* SVG content */}
  </svg>
));

StarIcon.displayName = 'StarIcon';
```

**2. Stable Callbacks**:

```javascript
// SheetBasedGame component
import { useCallback } from 'react';

const handleAnswer = useCallback((selectedAnswer, correctAnswer) => {
  if (!gameActive || feedback) return;

  const isCorrect = selectedAnswer === correctAnswer;
  setFeedback({ correct: isCorrect, selected: selectedAnswer });

  // ... rest of logic
}, [gameActive, feedback, currentQuestionIndex, streak, stars, difficulty]);
```

**3. Memoize Expensive Calculations**:

```javascript
// Leaderboard sorting
import { useMemo } from 'react';

const sortedLeaderboard = useMemo(() => {
  return [...leaderboard]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 10);
}, [leaderboard]);
```

**4. Lazy Load Components**:

```javascript
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

const EnhancedQAPage = lazy(() => import('./components/pages/EnhancedQAPage'));
const SettingsPage = lazy(() => import('./components/pages/SettingsPage'));

// Usage
{showQA && (
  <Suspense fallback={<LoadingSpinner />}>
    <EnhancedQAPage onBack={handleCloseQA} leaderboard={leaderboard} />
  </Suspense>
)}
```

**Expected Improvements**:
- Reduced re-renders: 40-50%
- Faster interaction response: 20-30ms
- Lower memory usage

---

#### 1.4 Security Hardening ⭐ MEDIUM
**Priority**: MEDIUM
**Time**: 2 hours
**Complexity**: Low

**1. Environment Variables**:

Create `.env`:
```
VITE_SETTINGS_PASSWORD=Superdad
VITE_MATH_SHEET_URL=https://docs.google.com/...
VITE_ENGLISH_SHEET_URL=https://docs.google.com/...
```

Update code:
```javascript
const SETTINGS_PASSWORD = import.meta.env.VITE_SETTINGS_PASSWORD || 'Superdad';
```

**2. Input Validation**:

```javascript
// Validate Google Sheets URLs
const validateSheetUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'docs.google.com' &&
           url.includes('/pub?output=csv');
  } catch {
    return false;
  }
};

// Sanitize user input
const sanitizeName = (name) => {
  return name
    .trim()
    .slice(0, 50)
    .replace(/[<>]/g, ''); // Remove HTML tags
};
```

**3. CSP Headers** (in index.html):

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://docs.google.com;
  font-src 'self' data:;
">
```

---

### Phase 1 Deliverable

✅ Production-ready Vite build
✅ 40% test coverage
✅ Performance optimized (memo, callbacks)
✅ Security hardened (env vars, validation)
✅ Deployment ready

**Success Metrics**:
- Lighthouse score: >90
- Bundle size: <100KB
- Initial load: <500ms
- Test coverage: >40%

---

## Phase 2: Type Safety & Architecture (1-2 Weeks)

### Goal
Reduce bugs, improve developer experience, and create scalable architecture.

### Tasks

#### 2.1 TypeScript Migration ⭐ HIGH
**Priority**: HIGH
**Time**: 3-5 days
**Complexity**: High

**Install TypeScript**:
```bash
npm install -D typescript @types/react @types/react-dom
```

**Create Type Definitions** (`src/types/index.ts`):

```typescript
// Difficulty levels
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// Subjects and categories
export type Subject = 'math' | 'english';
export type EnglishCategory = 'grammar' | 'vocabulary' | 'comprehension';

// Game definition
export interface GameDefinition {
  id: string;
  title: string;
  icon: string;
  color: string;
  difficulty: Difficulty;
  description: string;
}

// Question structure
export interface Question {
  id: string;
  gameType: string;
  question: string;
  answer: string;
  options?: string[];
  difficulty?: Difficulty;

  // Math-specific
  num1?: number;
  num2?: number;
  operation?: '+' | '-' | '×' | '÷';

  // Grammar-specific
  category?: string;
  wordClass?: 'noun' | 'verb' | 'adjective' | 'adverb';
  tense?: 'past' | 'present' | 'future';

  // Comprehension-specific
  story?: string;
  storyTitle?: string;
  hint?: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  name: string;
  stars: number;
  streak: number;
  subject: Subject;
  gameId: string;
  difficulty: Difficulty;
  date: string; // ISO 8601 format
}

// Settings
export interface Settings {
  mathSheetUrl: string;
  englishSheetUrl: string;
  selectedMathWorksheet: string;
  selectedEnglishWorksheet: string;
  defaultDifficulty: Difficulty | 'None';
  soundEnabled: boolean;
  leaderboardUrl: string;
  settingsSheetUrl: string;
}

// Theme configuration
export interface GameTheme {
  gradient: string;
  buttonBg: string;
  cardBg: string;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  // Comprehension-specific
  storyTitleColor?: string;
  questionBg?: string;
}

export interface DifficultyColor {
  bg: string;
  text: string;
  border: string;
  gradient: string;
  shadow: string;
}

// Component props
export interface SheetBasedGameProps {
  onBack: () => void;
  difficulty: Difficulty;
  onGameEnd: (gameId: string, name: string, stars: number, streak: number) => void;
  settings: Settings;
  gameId: string;
  title: string;
  icon: string;
  color: string;
  variant: string;
}

export interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export interface StarIconProps {
  className?: string;
}

// Hook return types
export interface UseSheetDataReturn {
  data: Question[];
  loading: boolean;
  error: string | null;
}
```

**Migration Strategy**:

1. **Week 1**: Utilities + Hooks
   - `src/utils/storage.ts`
   - `src/utils/csvParser.ts`
   - `src/hooks/useSheetData.ts`

2. **Week 2**: Components
   - Shared components first
   - Then page components
   - Finally main app file

**Example Migration**:

```typescript
// Before: DifficultyBadge.jsx
export const DifficultyBadge = ({ difficulty }) => {
  const colors = DIFFICULTY_COLORS[difficulty];
  return <span className={`${colors.bg} ...`}>{difficulty}</span>;
};

// After: DifficultyBadge.tsx
import { FC } from 'react';
import { DifficultyBadgeProps } from '../../types';
import { DIFFICULTY_COLORS } from '../../themes/themeConfig';

export const DifficultyBadge: FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const colors = DIFFICULTY_COLORS[difficulty];
  return <span className={`${colors.bg} ...`}>{difficulty}</span>;
};
```

---

#### 2.2 React Context Implementation ⭐ HIGH
**Priority**: HIGH
**Time**: 1 day
**Complexity**: Medium

**Create AppContext** (`src/contexts/AppContext.tsx`):

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings, LeaderboardEntry } from '../types';
import { storage } from '../utils/storage';
import { DEFAULT_SETTINGS } from '../data/gameDefinitions';

// Context types
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

interface LeaderboardContextType {
  leaderboard: LeaderboardEntry[];
  addScore: (entry: LeaderboardEntry) => Promise<void>;
  clearLeaderboard: () => Promise<void>;
}

// Create contexts
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

// Hooks
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within AppProvider');
  }
  return context;
};

export const useLeaderboard = () => {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within AppProvider');
  }
  return context;
};

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedSettings = await storage.get('learning-galaxy-settings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }

        const storedLeaderboard = await storage.get('learning-galaxy-leaderboard');
        if (storedLeaderboard) {
          setLeaderboard(JSON.parse(storedLeaderboard));
        }
      } catch (error) {
        console.error('Failed to load app data:', error);
      }
    };

    loadData();
  }, []);

  // Settings methods
  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      await storage.set('learning-galaxy-settings', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);

    try {
      await storage.set('learning-galaxy-settings', JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  // Leaderboard methods
  const addScore = async (entry: LeaderboardEntry) => {
    const newLeaderboard = [...leaderboard, entry];
    setLeaderboard(newLeaderboard);

    try {
      await storage.set('learning-galaxy-leaderboard', JSON.stringify(newLeaderboard));
    } catch (error) {
      console.error('Failed to save score:', error);
      throw error;
    }
  };

  const clearLeaderboard = async () => {
    setLeaderboard([]);

    try {
      await storage.set('learning-galaxy-leaderboard', JSON.stringify([]));
    } catch (error) {
      console.error('Failed to clear leaderboard:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      <LeaderboardContext.Provider value={{ leaderboard, addScore, clearLeaderboard }}>
        {children}
      </LeaderboardContext.Provider>
    </SettingsContext.Provider>
  );
};
```

**Update main.tsx**:
```typescript
import { AppProvider } from './contexts/AppContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
```

**Update Components**:
```typescript
// Before
const LearningGalaxy = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  return <SettingsPage settings={settings} setSettings={setSettings} />;
};

// After
const LearningGalaxy = () => {
  // No settings state needed!
  return <SettingsPage />;
};

// In SettingsPage
const SettingsPage = ({ onBack }) => {
  const { settings, updateSettings } = useSettings();

  // Use directly
};
```

---

#### 2.3 Extract Constants ⭐ LOW
**Priority**: LOW
**Time**: 1 hour
**Complexity**: Low

**Create constants.ts** (`src/constants/gameConfig.ts`):

```typescript
import { Difficulty } from '../types';

export const GAME_CONFIG = {
  // Timer durations by difficulty (seconds)
  TIMER_DURATIONS: {
    Easy: 50,
    Medium: 40,
    Hard: 30
  } as Record<Difficulty, number>,

  // Scoring multipliers
  DIFFICULTY_MULTIPLIERS: {
    Easy: 1.0,
    Medium: 1.5,
    Hard: 2.0
  } as Record<Difficulty, number>,

  // Base scoring
  SCORING: {
    BASE_SCORE: 10,
    STREAK_BONUS_MULTIPLIER: 0.1,
    MAX_STREAK: 10
  },

  // Game limits
  LIMITS: {
    MAX_QUESTIONS: 10,
    MIN_QUESTIONS: 5,
    MAX_PLAYER_NAME_LENGTH: 50,
    LEADERBOARD_SIZE: 10
  },

  // Animation durations (ms)
  ANIMATIONS: {
    FEEDBACK_DURATION: 1000,
    SLIDE_IN_DELAY: 50,
    TWINKLE_MIN: 2000,
    TWINKLE_MAX: 5000
  }
} as const;

export const STORAGE_KEYS = {
  SETTINGS: 'learning-galaxy-settings',
  LEADERBOARD: 'learning-galaxy-leaderboard'
} as const;
```

**Usage**:
```typescript
import { GAME_CONFIG } from '../constants/gameConfig';

// Instead of:
const timer = difficulty === 'Hard' ? 30 : difficulty === 'Medium' ? 40 : 50;

// Use:
const timer = GAME_CONFIG.TIMER_DURATIONS[difficulty];
```

---

### Phase 2 Deliverable

✅ Full TypeScript migration
✅ React Context for state management
✅ Centralized constants
✅ Reduced props drilling
✅ Better IDE autocomplete

---

## Phase 3: Enhanced Features (2-4 Weeks)

### 3.1 Multiplayer Mode (1 week)
**Use Case**: Students compete in real-time

**Tech Stack**:
- Firebase Realtime Database
- Room-based gameplay
- Synchronized questions

**Implementation**:

```typescript
// Create room
const createRoom = async (hostName: string, gameId: string, difficulty: Difficulty) => {
  const roomCode = generateRoomCode(); // e.g., "ABCD12"
  const roomRef = database.ref(`rooms/${roomCode}`);

  await roomRef.set({
    host: hostName,
    gameId,
    difficulty,
    players: { [hostName]: { score: 0, streak: 0, ready: false } },
    status: 'waiting', // waiting | playing | finished
    currentQuestion: 0,
    createdAt: Date.now()
  });

  return roomCode;
};

// Join room
const joinRoom = async (roomCode: string, playerName: string) => {
  const roomRef = database.ref(`rooms/${roomCode}`);
  const snapshot = await roomRef.once('value');

  if (!snapshot.exists()) throw new Error('Room not found');

  await roomRef.child(`players/${playerName}`).set({
    score: 0,
    streak: 0,
    ready: false
  });
};

// Sync answers
const submitAnswer = async (roomCode: string, playerName: string, correct: boolean) => {
  const playerRef = database.ref(`rooms/${roomCode}/players/${playerName}`);

  if (correct) {
    await playerRef.child('score').transaction(score => (score || 0) + 10);
    await playerRef.child('streak').transaction(streak => (streak || 0) + 1);
  } else {
    await playerRef.child('streak').set(0);
  }
};
```

**UI Components**:
- Room creation screen
- Join room screen
- Waiting lobby (show players)
- Live leaderboard during game
- Winner announcement

---

### 3.2 Progress Tracking (1 week)
**Use Case**: Teachers/parents track student progress

**Features**:
- Per-game mastery levels
- Skill gap identification
- Progress over time charts
- Recommendations

**Data Structure**:
```typescript
interface StudentProgress {
  studentId: string;
  name: string;
  gamesPlayed: {
    [gameId: string]: {
      attempts: number;
      avgScore: number;
      bestScore: number;
      lastPlayed: string;
      masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'master';
    };
  };
  skillGaps: string[]; // Game IDs where student struggles
  totalStars: number;
  currentStreak: number;
  longestStreak: number;
}
```

**UI Components**:
- Progress dashboard
- Charts (line chart for progress, bar chart for games)
- Skill recommendations
- Parent/teacher reports (PDF export)

---

### 3.3 Offline Support (2 days)
**Use Case**: Play without internet

**Implementation**:

```javascript
// Service worker (public/sw.js)
const CACHE_NAME = 'learning-galaxy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

**Manifest** (public/manifest.json):
```json
{
  "name": "Learning Galaxy",
  "short_name": "LG",
  "description": "Educational games for Grade 3-4",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a0a2e",
  "theme_color": "#9333ea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Features**:
- Installable on mobile
- Offline play with cached questions
- Sync scores when back online

---

### 3.4 Achievements System (2 days)
**Use Case**: Motivate students with badges

**Achievements**:
```typescript
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: StudentStats) => boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'perfect-10',
    title: 'Perfect 10',
    description: '10 correct answers in a row',
    icon: '🎯',
    condition: stats => stats.longestStreak >= 10,
    rarity: 'rare'
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Finish a game in under 2 minutes',
    icon: '⚡',
    condition: stats => stats.fastestTime < 120,
    rarity: 'epic'
  },
  {
    id: 'math-master',
    title: 'Math Master',
    description: 'Beat all 8 math games on Hard',
    icon: '🧮',
    condition: stats => stats.mathGamesCompleted.hard === 8,
    rarity: 'legendary'
  }
  // ... 20+ achievements
];
```

**UI**:
- Achievement showcase page
- Badge notifications
- Progress bars for each achievement

---

## Phase 4: Polish & Scale (2-3 Weeks)

### 4.1 Accessibility Overhaul (1 week)

**WCAG 2.1 AA Compliance**:

**1. Keyboard Navigation**:
```tsx
const GameTile = ({ game, onSelect }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(game.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(game.id)}
      onKeyDown={handleKeyDown}
      aria-label={`Play ${game.title}. ${game.description}`}
      className="..."
    >
      {/* Content */}
    </div>
  );
};
```

**2. ARIA Labels**:
```tsx
<button
  onClick={handleSubmit}
  aria-label="Submit answer"
  aria-disabled={!selectedAnswer}
>
  Submit
</button>

<div role="timer" aria-live="polite" aria-atomic="true">
  {timer} seconds remaining
</div>

<div role="status" aria-live="assertive">
  {feedback?.correct ? 'Correct!' : 'Incorrect, try again'}
</div>
```

**3. Focus Management**:
```tsx
import { useRef, useEffect } from 'react';

const GameQuestion = ({ question }) => {
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus first option when new question loads
    firstOptionRef.current?.focus();
  }, [question]);

  return (
    <div>
      <h2>{question.text}</h2>
      <button ref={firstOptionRef}>Option A</button>
      <button>Option B</button>
    </div>
  );
};
```

**4. Reduced Motion**:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**5. High Contrast Mode**:
```tsx
const useHighContrast = () => {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return highContrast;
};
```

---

### 4.2 Internationalization (1 week)

**Install i18n**:
```bash
npm install react-i18next i18next
```

**Setup** (`src/i18n.ts`):
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

**Translation Files**:

`src/locales/en.json`:
```json
{
  "welcome": "Welcome to Learning Galaxy!",
  "selectSubject": "Select a Subject",
  "math": "Math",
  "english": "English",
  "startGame": "Start Game",
  "difficulty": {
    "easy": "Easy",
    "medium": "Medium",
    "hard": "Hard"
  }
}
```

`src/locales/es.json`:
```json
{
  "welcome": "¡Bienvenido a Learning Galaxy!",
  "selectSubject": "Selecciona una Materia",
  "math": "Matemáticas",
  "english": "Inglés",
  "startGame": "Comenzar Juego",
  "difficulty": {
    "easy": "Fácil",
    "medium": "Medio",
    "hard": "Difícil"
  }
}
```

**Usage**:
```tsx
import { useTranslation } from 'react-i18next';

const MainLanding = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <h2>{t('selectSubject')}</h2>
      <button>{t('startGame')}</button>
    </div>
  );
};
```

---

## Phase 5: Platform Expansion (4-6 Weeks)

### 5.1 Backend API (2-3 weeks)

**Tech Stack**:
- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT authentication

**Database Schema**:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  scores    Score[]
  progress  Progress[]
}

model Score {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  gameId     String
  stars      Int
  streak     Int
  difficulty Difficulty
  completedAt DateTime @default(now())
}

model Progress {
  id           String  @id @default(uuid())
  userId       String
  user         User    @relation(fields: [userId], references: [id])
  gameId       String
  attempts     Int     @default(0)
  avgScore     Float   @default(0)
  bestScore    Int     @default(0)
  masteryLevel String  @default("beginner")
  updatedAt    DateTime @updatedAt
}

enum Role {
  STUDENT
  TEACHER
  PARENT
  ADMIN
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}
```

**API Endpoints**:
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/me
GET    /api/scores
POST   /api/scores
GET    /api/progress/:userId
GET    /api/leaderboard
POST   /api/questions (admin)
GET    /api/questions/:gameId
```

---

### 5.2 Mobile App (React Native) (2-3 weeks)

**Setup**:
```bash
npx react-native init LearningGalaxyMobile --template react-native-template-typescript
```

**Features**:
- Native navigation
- Push notifications
- Native storage
- App store deployment

---

## Success Metrics & KPIs

### Technical Metrics
- Lighthouse Score: >90
- Bundle Size: <150KB
- Initial Load: <500ms
- Test Coverage: >60%
- TypeScript Coverage: 100%

### User Metrics
- Daily Active Users (DAU)
- Average Session Duration
- Games Completed per Session
- Retention Rate (7-day, 30-day)
- Star Earnings per Day

### Educational Metrics
- Average Accuracy by Game
- Skill Improvement Over Time
- Most Challenging Topics
- Engagement by Subject

---

## Conclusion

This roadmap provides a clear path from the current state to a professional-grade educational platform. The phased approach allows for incremental improvements while maintaining a working product at each stage.

**Recommended Starting Point**: Phase 1 (Production Readiness)

**Next Action**: Set up Vite build system and establish testing infrastructure.
