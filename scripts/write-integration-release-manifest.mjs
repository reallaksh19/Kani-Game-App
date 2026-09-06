import fs from 'node:fs';
import path from 'node:path';

function parseBoolean(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function parseCsv(value) {
  return [...new Set(String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean))];
}

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  learnEnabled: parseBoolean(process.env.VITE_KANI_LEARN_ENABLED),
  practiceEnabled: parseBoolean(process.env.VITE_KANI_PRACTICE_ENABLED),
  studyHubBaseUrl: String(process.env.VITE_STUDY_HUB_BASE_URL || '').replace(/\/+$/, ''),
  studyHubCatalogPath: process.env.VITE_STUDY_HUB_CATALOG_PATH || '/content/catalog.json',
  allowedSubjects: parseCsv(process.env.VITE_STUDY_HUB_ALLOWED_SUBJECTS),
  allowedGrades: parseCsv(process.env.VITE_STUDY_HUB_ALLOWED_GRADES),
};

if (!manifest.studyHubBaseUrl) {
  throw new Error('VITE_STUDY_HUB_BASE_URL is required for a production integration manifest');
}

const outputPath = path.resolve('dist', 'integration-release.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Wrote ${outputPath}`);
console.log(`Learn=${manifest.learnEnabled} Practice=${manifest.practiceEnabled} Subjects=${manifest.allowedSubjects.join(',') || '(all)'}`);
