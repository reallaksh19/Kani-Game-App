import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BANK_DIR = path.join(ROOT, 'docs', 'questions', 'lq-champ');
const PUBLIC_DIR = path.join(ROOT, 'public', 'docs', 'questions', 'lq-champ');
const LOTS = [1, 2, 3, 4, 5];
const SKILLS = new Set([
  'Numerical Ability',
  'Verbal',
  'Analytical Thinking',
  'Memory and Concentration',
  'Visual',
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some(value => value.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }

    cell += ch;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some(value => value.trim() !== '')) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(values => Object.fromEntries(
    headers.map((header, index) => [header, (values[index] ?? '').trim()])
  ));
}

const failures = [];
const warnings = [];
const allPrompts = new Map();

function check(condition, message) {
  if (!condition) failures.push(message);
}

function countBy(items, selector) {
  const counts = new Map();
  items.forEach(item => {
    const key = selector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

for (const lot of LOTS) {
  const filename = `lot-${lot}.csv`;
  const docsPath = path.join(BANK_DIR, filename);
  const publicPath = path.join(PUBLIC_DIR, filename);

  check(fs.existsSync(docsPath), `Lot ${lot}: missing ${docsPath}`);
  check(fs.existsSync(publicPath), `Lot ${lot}: missing ${publicPath}`);
  if (!fs.existsSync(docsPath) || !fs.existsSync(publicPath)) continue;

  const docsText = fs.readFileSync(docsPath, 'utf8');
  const publicText = fs.readFileSync(publicPath, 'utf8');
  check(docsText === publicText, `Lot ${lot}: docs and public CSV copies differ`);

  const questions = parseCsv(docsText);
  check(questions.length === 20, `Lot ${lot}: expected 20 questions, found ${questions.length}`);

  const difficulty = countBy(questions, q => q.difficulty);
  check(difficulty.get('Medium') === 15, `Lot ${lot}: expected 15 Medium questions`);
  check(difficulty.get('Hard') === 5, `Lot ${lot}: expected 5 Hard questions`);

  const skillCounts = countBy(questions, q => q.text2);
  for (const skill of SKILLS) {
    check((skillCounts.get(skill) ?? 0) >= 1, `Lot ${lot}: missing skill "${skill}"`);
  }
  for (const skill of skillCounts.keys()) {
    check(SKILLS.has(skill), `Lot ${lot}: non-canonical skill label "${skill}"`);
  }

  const hardSkills = new Set(questions.filter(q => q.difficulty === 'Hard').map(q => q.text2));
  if (lot === 1) {
    check(hardSkills.size >= 4, 'Lot 1: sample-based Hard section should cover at least 4 core skills');
  } else {
    check(hardSkills.size === 5, `Lot ${lot}: Hard section should contain exactly one question from each core skill`);
  }

  const answerPositions = [0, 0, 0, 0];

  questions.forEach((question, index) => {
    const label = `Lot ${lot} Q${String(index + 1).padStart(2, '0')}`;
    const options = [question.option1, question.option2, question.option3, question.option4];

    check(question.game_type === `lq-lot-${lot}`, `${label}: incorrect game_type`);
    check(question.grade === 'Grade 4', `${label}: grade must be "Grade 4"`);
    check(SKILLS.has(question.text2), `${label}: invalid skill "${question.text2}"`);
    check(question.subtopic.length >= 3, `${label}: subtopic is required`);
    check(question.text1.length >= 25, `${label}: prompt is too short for a reasoning item`);
    check(question.hint.length >= 20, `${label}: hint should guide reasoning, not give away the answer`);
    check(question.know_more.length >= 60, `${label}: solution should show the reasoning process`);
    check(options.every(Boolean), `${label}: all 4 options are required`);
    check(new Set(options).size === 4, `${label}: options must be unique`);

    const occurrences = options.filter(option => option === question.answer).length;
    check(occurrences === 1, `${label}: answer must occur exactly once among the 4 options`);

    const answerIndex = options.indexOf(question.answer);
    if (answerIndex >= 0) answerPositions[answerIndex] += 1;

    if (question.difficulty === 'Hard') {
      check(question.cognitive_demand === '3-step', `${label}: Hard items must be tagged 3-step`);
      check(question.know_more.length >= 90, `${label}: Hard solution should explain multiple reasoning steps`);
    } else {
      check(question.cognitive_demand === '2-step', `${label}: Medium items must be tagged 2-step`);
    }

    if (question.text2 === 'Visual') {
      check(question.image_url.startsWith('svg:'), `${label}: Visual items must use a reviewable SVG protocol`);
    }

    const normalizedPrompt = question.text1.toLowerCase().replace(/\s+/g, ' ').trim();
    const previous = allPrompts.get(normalizedPrompt);
    check(!previous, `${label}: duplicates ${previous ?? 'another question'}`);
    allPrompts.set(normalizedPrompt, label);

    if (options.some(option => /\b\d{1,2}:([6-9]\d)\b/.test(option))) {
      failures.push(`${label}: contains an impossible clock-time distractor`);
    }
  });

  answerPositions.forEach((count, index) => {
    check(count === 5, `Lot ${lot}: answer position ${String.fromCharCode(65 + index)} should occur 5 times, found ${count}`);
  });

  const hardCountBySkill = countBy(
    questions.filter(q => q.difficulty === 'Hard'),
    q => q.text2
  );
  if (lot > 1) {
    for (const skill of SKILLS) {
      check(hardCountBySkill.get(skill) === 1, `Lot ${lot}: expected exactly one Hard "${skill}" question`);
    }
  }

  console.log(
    `Lot ${lot}: ${questions.length} questions | ` +
    `${difficulty.get('Medium') ?? 0} Medium / ${difficulty.get('Hard') ?? 0} Hard | ` +
    `skills ${[...SKILLS].map(skill => `${skill}:${skillCounts.get(skill) ?? 0}`).join(', ')}`
  );
}

if (warnings.length) {
  console.warn('\nWarnings:');
  warnings.forEach(warning => console.warn(`- ${warning}`));
}

if (failures.length) {
  console.error('\nLQ Grade 4 audit failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('\nLQ Grade 4 audit passed: 5 lots, 100 questions, canonical skills, balanced answer keys, SVG-backed visuals, and detailed solutions.');
