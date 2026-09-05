import { Difficulty } from '../types';

export type ActiveDifficulty = 'Easy' | 'Medium' | 'Hard';
export type Rng = () => number;

export const normalizeDifficulty = (difficulty: Difficulty, rng: Rng = Math.random): ActiveDifficulty => {
    if (difficulty !== 'None') return difficulty;
    const choices: ActiveDifficulty[] = ['Easy', 'Medium', 'Hard'];
    return choices[Math.floor(rng() * choices.length)];
};

const randInt = (min: number, max: number, rng: Rng) => Math.floor(rng() * (max - min + 1)) + min;

export const shuffle = <T,>(items: T[], rng: Rng = Math.random): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export interface ScaleRound {
    difficulty: ActiveDifficulty;
    leftItems: number[];
    answer: number;
    options: number[];
}

export const generateScaleRound = (difficulty: Difficulty, rng: Rng = Math.random): ScaleRound => {
    const active = normalizeDifficulty(difficulty, rng);
    const profile = active === 'Easy'
        ? { count: 2, min: 1, max: 5 }
        : active === 'Medium'
            ? { count: 3, min: 2, max: 7 }
            : { count: 4, min: 2, max: 9 };

    const leftItems = Array.from({ length: profile.count }, () => randInt(profile.min, profile.max, rng));
    const answer = leftItems.reduce((sum, value) => sum + value, 0);
    const options = new Set<number>([answer]);
    const offsets = shuffle([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5], rng);
    for (const offset of offsets) {
        if (options.size >= 4) break;
        if (answer + offset > 0) options.add(answer + offset);
    }
    return { difficulty: active, leftItems, answer, options: shuffle([...options], rng) };
};

export interface Coord { x: number; y: number; }
export interface PathLevel {
    difficulty: ActiveDifficulty;
    size: number;
    start: Coord;
    goal: Coord;
    obstacles: string[];
    stars: string[];
    shortestPathLength: number;
    maxMoves: number;
}

export const coordKey = ({ x, y }: Coord) => `${x},${y}`;

export const shortestPathLength = (size: number, start: Coord, goal: Coord, obstacles: Set<string>): number => {
    const queue: Array<{ pos: Coord; dist: number }> = [{ pos: start, dist: 0 }];
    const seen = new Set<string>([coordKey(start)]);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (queue.length) {
        const current = queue.shift()!;
        if (current.pos.x === goal.x && current.pos.y === goal.y) return current.dist;
        for (const [dx, dy] of dirs) {
            const next = { x: current.pos.x + dx, y: current.pos.y + dy };
            if (next.x < 0 || next.y < 0 || next.x >= size || next.y >= size) continue;
            const key = coordKey(next);
            if (obstacles.has(key) || seen.has(key)) continue;
            seen.add(key);
            queue.push({ pos: next, dist: current.dist + 1 });
        }
    }
    return Number.POSITIVE_INFINITY;
};

export const generatePathLevel = (difficulty: Difficulty, rng: Rng = Math.random): PathLevel => {
    const active = normalizeDifficulty(difficulty, rng);
    const profile = active === 'Easy'
        ? { size: 4, obstacles: 2, stars: 0, slack: 4 }
        : active === 'Medium'
            ? { size: 5, obstacles: 5, stars: 1, slack: 3 }
            : { size: 6, obstacles: 9, stars: 2, slack: 2 };
    const start = { x: 0, y: profile.size - 1 };
    const goal = { x: profile.size - 1, y: 0 };
    const candidates: Coord[] = [];
    for (let y = 0; y < profile.size; y += 1) {
        for (let x = 0; x < profile.size; x += 1) {
            if ((x === start.x && y === start.y) || (x === goal.x && y === goal.y)) continue;
            candidates.push({ x, y });
        }
    }

    let obstacleSet = new Set<string>();
    let shortest = Number.POSITIVE_INFINITY;
    for (let attempt = 0; attempt < 100; attempt += 1) {
        const selected = shuffle(candidates, rng).slice(0, profile.obstacles);
        obstacleSet = new Set(selected.map(coordKey));
        shortest = shortestPathLength(profile.size, start, goal, obstacleSet);
        if (Number.isFinite(shortest)) break;
    }
    if (!Number.isFinite(shortest)) {
        obstacleSet = new Set();
        shortest = shortestPathLength(profile.size, start, goal, obstacleSet);
    }

    const free = candidates.filter(coord => !obstacleSet.has(coordKey(coord)));
    const stars = shuffle(free, rng).slice(0, profile.stars).map(coordKey);
    return {
        difficulty: active,
        size: profile.size,
        start,
        goal,
        obstacles: [...obstacleSet],
        stars,
        shortestPathLength: shortest,
        maxMoves: shortest + profile.slack + profile.stars * 2,
    };
};

export type ChartType = 'bar' | 'pie' | 'line';
export interface DataPoint { label: string; value: number; }
export interface DataRound {
    difficulty: ActiveDifficulty;
    chartType: ChartType;
    points: DataPoint[];
    question: string;
    answer: string;
    options: string[];
}

const DATA_LABELS = ['Apples', 'Bananas', 'Oranges', 'Grapes', 'Pears', 'Mangoes'];

export const generateDataRound = (difficulty: Difficulty, rng: Rng = Math.random): DataRound => {
    const active = normalizeDifficulty(difficulty, rng);
    const count = active === 'Easy' ? 3 : active === 'Medium' ? 4 : 5;
    const labels = shuffle(DATA_LABELS, rng).slice(0, count);
    const values = shuffle(Array.from({ length: 18 }, (_, i) => i + 3), rng).slice(0, count);
    const points = labels.map((label, i) => ({ label, value: values[i] }));
    const chartTypes: ChartType[] = active === 'Easy' ? ['bar'] : active === 'Medium' ? ['bar', 'pie'] : ['bar', 'pie', 'line'];
    const chartType = chartTypes[Math.floor(rng() * chartTypes.length)];
    const qTypes = active === 'Easy' ? ['max', 'min', 'pairSum'] : active === 'Medium' ? ['max', 'min', 'total', 'compare'] : ['max', 'min', 'total', 'compare', 'difference'];
    const qType = qTypes[Math.floor(rng() * qTypes.length)];

    let question = '';
    let answer = '';
    if (qType === 'max') {
        const max = points.reduce((a, b) => a.value > b.value ? a : b);
        question = 'Which item has the greatest value?';
        answer = max.label;
    } else if (qType === 'min') {
        const min = points.reduce((a, b) => a.value < b.value ? a : b);
        question = 'Which item has the smallest value?';
        answer = min.label;
    } else if (qType === 'pairSum') {
        question = `How many ${points[0].label} and ${points[1].label} are there altogether?`;
        answer = String(points[0].value + points[1].value);
    } else if (qType === 'total') {
        question = 'What is the total of all values shown?';
        answer = String(points.reduce((sum, p) => sum + p.value, 0));
    } else if (qType === 'difference') {
        const [a, b] = points.slice(0, 2).sort((x, y) => y.value - x.value);
        question = `How many more ${a.label} are there than ${b.label}?`;
        answer = String(a.value - b.value);
    } else {
        question = `Are there more ${points[0].label} than ${points[1].label}?`;
        answer = points[0].value > points[1].value ? 'Yes' : 'No';
    }

    if (answer === 'Yes' || answer === 'No') {
        return { difficulty: active, chartType, points, question, answer, options: ['Yes', 'No'] };
    }
    if (points.some(p => p.label === answer)) {
        return { difficulty: active, chartType, points, question, answer, options: shuffle(points.map(p => p.label), rng) };
    }

    const numeric = Number(answer);
    const opts = new Set<number>([numeric]);
    for (const offset of shuffle([-4, -3, -2, -1, 1, 2, 3, 4], rng)) {
        if (opts.size >= 4) break;
        if (numeric + offset >= 0) opts.add(numeric + offset);
    }
    return { difficulty: active, chartType, points, question, answer, options: shuffle([...opts].map(String), rng) };
};

export type MirrorAxis = 'vertical' | 'horizontal';
export interface MirrorRound {
    difficulty: ActiveDifficulty;
    size: number;
    axis: MirrorAxis;
    pattern: number[];
    options: number[][];
    correctIndex: number;
}

export const reflectPattern = (pattern: number[], size: number, axis: MirrorAxis): number[] => {
    const result = Array(pattern.length).fill(0);
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const source = y * size + x;
            const tx = axis === 'vertical' ? size - 1 - x : x;
            const ty = axis === 'horizontal' ? size - 1 - y : y;
            result[ty * size + tx] = pattern[source];
        }
    }
    return result;
};

export const generateMirrorRound = (difficulty: Difficulty, rng: Rng = Math.random): MirrorRound => {
    const active = normalizeDifficulty(difficulty, rng);
    const size = active === 'Easy' ? 3 : 4;
    const axis: MirrorAxis = active === 'Easy' ? 'vertical' : rng() < 0.5 ? 'vertical' : 'horizontal';
    let pattern: number[] = [];
    let correct: number[] = [];
    for (let attempt = 0; attempt < 60; attempt += 1) {
        const density = active === 'Hard' ? 0.55 : 0.42;
        pattern = Array.from({ length: size * size }, () => rng() < density ? 1 : 0);
        correct = reflectPattern(pattern, size, axis);
        if (pattern.some(Boolean) && pattern.join('') !== correct.join('')) break;
    }

    const optionMap = new Map<string, number[]>();
    optionMap.set(correct.join(''), correct);
    optionMap.set(pattern.join(''), pattern);
    let guard = 0;
    while (optionMap.size < 4 && guard < 100) {
        guard += 1;
        const candidate = [...correct];
        const mutations = active === 'Hard' ? 1 : 2;
        for (let i = 0; i < mutations; i += 1) {
            const index = randInt(0, candidate.length - 1, rng);
            candidate[index] = candidate[index] ? 0 : 1;
        }
        optionMap.set(candidate.join(''), candidate);
    }
    const options = shuffle([...optionMap.values()].slice(0, 4), rng);
    const correctIndex = options.findIndex(option => option.join('') === correct.join(''));
    return { difficulty: active, size, axis, pattern, options, correctIndex };
};

export interface VennItem { id: string; emoji: string; label: string; traits: string[]; }
export type VennZone = 'A' | 'B' | 'Both' | 'None';
export interface VennPair { A: string; B: string; }

export const VENN_ITEMS: VennItem[] = [
    { id: 'apple', emoji: '🍎', label: 'Apple', traits: ['red', 'fruit', 'round', 'food'] },
    { id: 'banana', emoji: '🍌', label: 'Banana', traits: ['yellow', 'fruit', 'long', 'food'] },
    { id: 'grape', emoji: '🍇', label: 'Grape', traits: ['purple', 'fruit', 'round', 'food'] },
    { id: 'carrot', emoji: '🥕', label: 'Carrot', traits: ['orange', 'vegetable', 'long', 'food'] },
    { id: 'ball', emoji: '⚽', label: 'Ball', traits: ['white', 'toy', 'round', 'sport'] },
    { id: 'fire', emoji: '🔥', label: 'Fire', traits: ['red', 'hot', 'danger'] },
    { id: 'sun', emoji: '☀️', label: 'Sun', traits: ['yellow', 'hot', 'round', 'nature'] },
    { id: 'frog', emoji: '🐸', label: 'Frog', traits: ['green', 'animal', 'jump'] },
    { id: 'bird', emoji: '🐦', label: 'Bird', traits: ['blue', 'animal', 'fly'] },
    { id: 'plane', emoji: '✈️', label: 'Plane', traits: ['white', 'vehicle', 'fly'] },
    { id: 'car', emoji: '🚗', label: 'Car', traits: ['red', 'vehicle', 'drive'] },
    { id: 'cookie', emoji: '🍪', label: 'Cookie', traits: ['brown', 'food', 'round'] },
];

const VENN_PAIRS: Record<ActiveDifficulty, VennPair[]> = {
    Easy: [{ A: 'red', B: 'fruit' }, { A: 'round', B: 'food' }],
    Medium: [{ A: 'vehicle', B: 'red' }, { A: 'fruit', B: 'long' }, { A: 'hot', B: 'round' }],
    Hard: [{ A: 'animal', B: 'fly' }, { A: 'food', B: 'long' }, { A: 'red', B: 'round' }],
};

export const vennTargetCount = (difficulty: ActiveDifficulty) => difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 7 : 9;

export const chooseVennPair = (difficulty: Difficulty, rng: Rng = Math.random): { difficulty: ActiveDifficulty; pair: VennPair } => {
    const active = normalizeDifficulty(difficulty, rng);
    const pairs = VENN_PAIRS[active];
    return { difficulty: active, pair: pairs[Math.floor(rng() * pairs.length)] };
};

export const classifyVennItem = (item: VennItem, pair: VennPair): VennZone => {
    const hasA = item.traits.includes(pair.A);
    const hasB = item.traits.includes(pair.B);
    if (hasA && hasB) return 'Both';
    if (hasA) return 'A';
    if (hasB) return 'B';
    return 'None';
};

export const pickVennItem = (pair: VennPair, rng: Rng = Math.random, previousId?: string): VennItem => {
    const pool = VENN_ITEMS.filter(item => item.id !== previousId);
    const useful = pool.filter(item => classifyVennItem(item, pair) !== 'None');
    const source = rng() < 0.75 && useful.length ? useful : pool;
    return source[Math.floor(rng() * source.length)];
};
