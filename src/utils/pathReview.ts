import { Coord, coordKey, PathLevel } from './brainGameGenerators';

const DIRS: Array<[number, number]> = [[1, 0], [0, -1], [-1, 0], [0, 1]];

export const findOptimalPath = (level: Pick<PathLevel, 'size' | 'start' | 'goal' | 'obstacles'>): string[] => {
    const blocked = new Set(level.obstacles);
    const startKey = coordKey(level.start);
    const goalKey = coordKey(level.goal);
    const queue: Coord[] = [level.start];
    const seen = new Set<string>([startKey]);
    const parent = new Map<string, string | null>([[startKey, null]]);

    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentKey = coordKey(current);
        if (currentKey === goalKey) break;

        for (const [dx, dy] of DIRS) {
            const next = { x: current.x + dx, y: current.y + dy };
            if (next.x < 0 || next.y < 0 || next.x >= level.size || next.y >= level.size) continue;
            const key = coordKey(next);
            if (blocked.has(key) || seen.has(key)) continue;
            seen.add(key);
            parent.set(key, currentKey);
            queue.push(next);
        }
    }

    if (!parent.has(goalKey)) return [];

    const path: string[] = [];
    let cursor: string | null = goalKey;
    while (cursor) {
        path.push(cursor);
        cursor = parent.get(cursor) ?? null;
    }
    return path.reverse();
};
