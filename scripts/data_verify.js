
import fs from 'fs';
import path from 'path';

const csvPath = path.resolve('public/SKILL_GAMES_DATA.csv');
const data = fs.readFileSync(csvPath, 'utf8');
const lines = data.split('\n').filter(l => l.trim());

// Skip header
const rows = lines.slice(1);

const stats = {};

rows.forEach(row => {
    // Basic CSV parsing (not robust for commas in quotes but sufficient for game_type/difficulty check)
    // Actually, simple split is risky if first columns have commas. 
    // game_type and difficulty usually don't have commas.
    const parts = row.split(',');
    const gameType = parts[0]?.trim();
    const difficulty = parts[1]?.trim();

    if (!gameType || !difficulty) return;

    if (!stats[gameType]) stats[gameType] = { Easy: 0, Medium: 0, Hard: 0 };
    if (stats[gameType][difficulty] !== undefined) {
        stats[gameType][difficulty]++;
    }
});

let passed = true;
const REQUIRED_COUNT = 3;

// Known skill games from gameDefinitions (just hardcoded list for verification based on file content)
const SKILL_GAMES = [
    'pattern-forge', 'logic-lab', 'odd-wizard', 'sorting-station', 'code-breaker',
    'memory-matrix', 'sequence-sprint', 'path-planner',
    'data-detective', 'venn-voyager', 'mirror-match', 'scale-sense'
];

console.log('--- Data Integrity Check ---');
SKILL_GAMES.forEach(game => {
    const s = stats[game];
    if (!s) {
        console.error(`[FAIL] ${game}: No data found!`);
        passed = false;
        return;
    }

    ['Easy', 'Medium', 'Hard'].forEach(diff => {
        const count = s[diff];
        if (count < REQUIRED_COUNT) {
            console.error(`[FAIL] ${game} - ${diff}: Found ${count}, required ${REQUIRED_COUNT}`);
            passed = false;
        } else {
            console.log(`[PASS] ${game} - ${diff}: ${count} items`);
        }
    });
});

if (passed) {
    console.log('\n✅ All data checks passed!');
    process.exit(0);
} else {
    console.error('\n❌ Data checks failed!');
    process.exit(1);
}
