import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const GAME_DIR = path.join(ROOT, 'public', 'games');
const BANKS = {
  'analogy-arena': 'Verbal Reasoning',
  'cause-effect': 'Analytical Thinking',
  'classify-quest': 'Classification',
  'sequence-story': 'Sequencing',
  'pattern-forge': 'Pattern Recognition',
  'code-breaker': 'Coding and Decoding',
  'logic-lab': 'Deductive Logic',
  'odd-wizard': 'Classification',
  'sorting-station': 'Ordering and Sequencing',
};
const EXPECTED_DEMAND = { Easy: '1-step', Medium: '2-step', Hard: '3-step' };

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { cell += '"'; i += 1; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) { row.push(cell); cell = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); if (row.some(v => v.trim() !== '')) rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()])));
}

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
let total = 0;

for (const [gameId, skill] of Object.entries(BANKS)) {
  const file = path.join(GAME_DIR, `${gameId}.csv`);
  check(fs.existsSync(file), `${gameId}: missing CSV`);
  if (!fs.existsSync(file)) continue;

  const questions = parseCsv(fs.readFileSync(file, 'utf8'));
  total += questions.length;
  check(questions.length === 30, `${gameId}: expected 30 questions, found ${questions.length}`);

  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  const prompts = new Set();
  const answerPositions = [0, 0, 0, 0];

  questions.forEach((q, index) => {
    const label = `${gameId} Q${String(index + 1).padStart(2, '0')}`;
    if (Object.hasOwn(counts, q.difficulty)) counts[q.difficulty] += 1;
    else failures.push(`${label}: invalid difficulty "${q.difficulty}"`);

    const options = [q.option1, q.option2, q.option3, q.option4];
    check(q.game_type === gameId, `${label}: game_type must be ${gameId}`);
    check(q.grade === 'Grade 4', `${label}: grade must be Grade 4`);
    check(q.skill === skill, `${label}: skill must be "${skill}"`);
    check(q.cognitive_demand === EXPECTED_DEMAND[q.difficulty], `${label}: cognitive_demand does not match difficulty`);
    check(q.text1.length >= 8, `${label}: prompt is too short`);
    check(q.text2.length >= 3, `${label}: concept label is required`);
    check(q.hint.length >= 10, `${label}: hint is too short`);
    check(q.know_more.length >= 20, `${label}: worked explanation is too short`);
    check(options.every(Boolean), `${label}: all four options are required`);
    check(new Set(options).size === 4, `${label}: options must be unique`);
    check(options.filter(o => o === q.answer).length === 1, `${label}: answer must appear exactly once`);

    const answerIndex = options.indexOf(q.answer);
    if (answerIndex >= 0) answerPositions[answerIndex] += 1;

    const normalized = q.text1.toLowerCase().replace(/\s+/g, ' ').trim();
    check(!prompts.has(normalized), `${label}: duplicate prompt inside bank`);
    prompts.add(normalized);
  });

  for (const difficulty of ['Easy', 'Medium', 'Hard']) {
    check(counts[difficulty] === 10, `${gameId}: expected 10 ${difficulty}, found ${counts[difficulty]}`);
  }
  const spread = Math.max(...answerPositions) - Math.min(...answerPositions);
  check(spread <= 1, `${gameId}: answer positions are imbalanced (${answerPositions.join('/')})`);

  console.log(`${gameId}: ${questions.length} | ${counts.Easy} Easy / ${counts.Medium} Medium / ${counts.Hard} Hard | ${skill}`);
}

check(total === 270, `expected 270 audited Brain Training questions, found ${total}`);

if (failures.length) {
  console.error('\nBrain Training Grade 4 audit failed:');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log('\nBrain Training Grade 4 audit passed: 9 banks, 270 questions, balanced difficulty tiers and answer positions, unique options, Grade 4 metadata, hints, and worked explanations.');
