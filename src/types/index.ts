export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'None';

export interface GameDefinition {
    id: string;
    title: string;
    icon: string;
    color: string;
    difficulty?: Difficulty;
    description: string;
}

export interface Question {
    game_type: string;
    difficulty?: string;
    num1?: string;
    num2?: string;
    operation?: string;
    answer: string;
    option1?: string;
    option2?: string;
    option3?: string;
    option4?: string;
    hint?: string;
    text1?: string;
    text2?: string;
    topic?: string;
    subtopic?: string;
    category?: string;
    know_more?: string;
    explanation?: string; // Mapped from know_more
    image_url?: string;
    // New fields for story-jammer
    story_id?: string;
    passage?: string;
    question_num?: string;
    question_type?: string;
    level?: string;
}

export interface Feedback {
    correct: boolean;
    answer?: string;
    explanation?: string;
}

export interface Settings {
    mathSheetUrl: string;
    englishSheetUrl: string;
    skillSheetUrl: string;
    examSheetUrl?: string; // Optional for backward compatibility but initialized in default
    topicSheetUrl: string;
    selectedTopics: string;
    selectedSubtopics: string;
    selectedMathWorksheet: string;
    selectedEnglishWorksheet: string;
    defaultDifficulty: Difficulty;
    difficultyFilterEnabled: boolean;
    soundEnabled: boolean;
    randomize: boolean;
    kidMode: boolean;
    leaderboardUrl: string;
    settingsSheetUrl: string;
    enabledGames: Record<string, boolean>;
    generatorGrade: string;
    generatorDifficulty: string;
    surpriseMode: boolean;
    useGoogleSheets?: boolean;
    levelUpMode?: boolean;
}

export interface QAStats {
    totalGames: number;
    totalStars: number;
    avgStars: number;
    bestStreak: number;
}

export interface MostPlayedGame extends GameDefinition {
    playCount: number;
    questions?: Question[];
}

export interface TopPerformer extends LeaderboardEntry {
    gameTitle: string;
}

export interface ThemeConfig {
    gradient: string;
    buttonBg: string;
    cardBg: string;
    accentColor: string;
    borderColor: string;
    glowColor: string;
    storyTitleColor?: string;
    questionBg?: string;
    magnifyingGlass?: string;
    id?: string;
    background?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
}

export interface LeaderboardEntry {
    game: string;
    name: string;
    stars: number;
    streak: number;
    date: string;
    hintsUsed?: number;
}
