export type ReviewDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed' | string;

interface BaseBrainReviewItem {
    id: string;
    round: number;
    correct: boolean;
    difficulty: ReviewDifficulty;
}

export interface MemoryReviewItem extends BaseBrainReviewItem {
    kind: 'memory';
    gridSize: number;
    targetCells: number[];
    selectedCells: number[];
}

export interface SequenceReviewItem extends BaseBrainReviewItem {
    kind: 'sequence';
    target: string[];
    selected: string[];
}

export interface PathReviewItem extends BaseBrainReviewItem {
    kind: 'path';
    size: number;
    start: string;
    goal: string;
    obstacles: string[];
    stars: string[];
    userPath: string[];
    optimalPath: string[];
    moveCount: number;
    optimalMoves: number;
}

export interface DataReviewItem extends BaseBrainReviewItem {
    kind: 'data';
    chartType: 'bar' | 'pie' | 'line';
    question: string;
    points: Array<{ label: string; value: number }>;
    selected: string;
    answer: string;
}

export interface VennReviewItem extends BaseBrainReviewItem {
    kind: 'venn';
    itemLabel: string;
    itemEmoji: string;
    traits: string[];
    setA: string;
    setB: string;
    selectedZone: 'A' | 'B' | 'Both' | 'None';
    correctZone: 'A' | 'B' | 'Both' | 'None';
}

export interface MirrorReviewItem extends BaseBrainReviewItem {
    kind: 'mirror';
    size: number;
    axis: 'vertical' | 'horizontal';
    pattern: number[];
    selectedPattern: number[];
    correctPattern: number[];
}

export interface ScaleReviewItem extends BaseBrainReviewItem {
    kind: 'scale';
    leftItems: number[];
    selected: number;
    answer: number;
}

export type BrainReviewItem =
    | MemoryReviewItem
    | SequenceReviewItem
    | PathReviewItem
    | DataReviewItem
    | VennReviewItem
    | MirrorReviewItem
    | ScaleReviewItem;
