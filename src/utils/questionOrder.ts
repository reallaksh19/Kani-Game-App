export type RandomSource = () => number;

export const shuffleItems = <T>(items: T[], rng: RandomSource = Math.random): T[] => {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Returns a new array in either authored order or shuffled order.
 * The source array is never mutated.
 */
export const orderItems = <T>(items: T[], randomize: boolean, rng: RandomSource = Math.random): T[] => {
    return randomize ? shuffleItems(items, rng) : [...items];
};

/**
 * Picks one item when randomisation is enabled, otherwise the first authored item.
 */
export const pickOrderedItem = <T>(items: T[], randomize: boolean, rng: RandomSource = Math.random): T | undefined => {
    if (items.length === 0) return undefined;
    if (!randomize) return items[0];
    return items[Math.floor(rng() * items.length)];
};
