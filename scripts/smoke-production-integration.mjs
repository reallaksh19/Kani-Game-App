import assert from 'node:assert/strict';

const kaniAppUrl = (process.env.KANI_APP_URL || 'https://reallaksh19.github.io/Kani-Game-App/').replace(/\/+$/, '/');
const studyHubBaseUrl = (process.env.STUDY_HUB_BASE_URL || 'https://reallaksh19.github.io/Study-Hub').replace(/\/+$/, '');
const catalogPath = process.env.STUDY_HUB_CATALOG_PATH || '/content/catalog.json';
const expectedSubjects = String(process.env.EXPECTED_SUBJECTS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const expectedLearnEnabled = String(process.env.EXPECTED_LEARN_ENABLED || 'true').toLowerCase() === 'true';
const expectedPracticeEnabled = String(process.env.EXPECTED_PRACTICE_ENABLED || 'false').toLowerCase() === 'true';
const expectedMinStructuredQuestions = Math.max(0, Number(process.env.EXPECTED_MIN_STRUCTURED_QUESTIONS || 0));
const primaryMissionToken = String(process.env.PRIMARY_FRACTION_MISSION_TOKEN || 'P4FE7K2Q').trim().toUpperCase();
const primaryMissionId = 'KM-G4-FRAC-EQUIV-001';
const primaryLearningEpisodeId = 'EP-G4-FRAC-EQUIV-001';
const primaryLearningObjectId = 'MATH-FRAC-EQUIVALENCE';
const primaryReturnQuestionId = 'fraction-equiv-return-q-201';
const primaryDelayedQuestionId = 'fraction-equiv-delayed-q-301';

function joinBase(baseUrl, contentPath) {
  return `${baseUrl.replace(/\/+$/, '')}/${String(contentPath).replace(/^\/+/, '')}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry(label, operation, attempts = 12, delayMs = 5000) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      console.warn(`${label} attempt ${attempt}/${attempts} failed: ${error.message}`);
      await sleep(delayMs);
    }
  }
  throw new Error(`${label} failed after ${attempts} attempts: ${lastError?.message || lastError}`);
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    redirect: 'follow',
    cache: 'no-store',
    ...options,
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return { response, text: await response.text() };
}

async function fetchJson(url, options = {}) {
  const { response, text } = await fetchText(url, options);
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}: ${error.message}`);
  }
  return { response, value };
}

const cacheBust = () => `smoke=${Date.now()}_${Math.random().toString(36).slice(2)}`;
const withCacheBust = (url) => `${url}${url.includes('?') ? '&' : '?'}${cacheBust()}`;

await retry('Kani app shell', async () => {
  const { text } = await fetchText(withCacheBust(kaniAppUrl));
  assert.match(text, /<html|<!doctype/i, 'Kani deployment did not return an HTML app shell');
});

const manifest = await retry('Kani integration release manifest', async () => {
  const manifestUrl = new URL(`integration-release.json?${cacheBust()}`, kaniAppUrl).toString();
  const { value } = await fetchJson(manifestUrl);
  assert.equal(value.schemaVersion, 1, 'Unexpected integration manifest schema version');
  assert.equal(value.learnEnabled, expectedLearnEnabled, 'Deployed Learn flag does not match the release expectation');
  assert.equal(value.practiceEnabled, expectedPracticeEnabled, 'Deployed Practice flag does not match the release expectation');
  assert.equal(value.studyHubBaseUrl, studyHubBaseUrl, 'Deployed Study-Hub base URL does not match the smoke target');
  for (const subjectId of expectedSubjects) {
    assert.ok(value.allowedSubjects?.includes(subjectId), `Release manifest does not allow subject ${subjectId}`);
  }
  return value;
});

const catalogUrl = joinBase(studyHubBaseUrl, catalogPath);
const catalog = await retry('Study-Hub catalog', async () => {
  const requestOrigin = new URL(kaniAppUrl).origin;
  const { response, value } = await fetchJson(withCacheBust(catalogUrl), {
    headers: { Origin: requestOrigin },
  });
  assert.equal(value.schemaVersion, '1.0', 'Unexpected Study-Hub catalog schema version');
  assert.equal(value.sourceApp, 'study-hub', 'Unexpected catalog source app');
  assert.ok(Array.isArray(value.subjects) && Array.isArray(value.topics) && Array.isArray(value.pages), 'Catalog arrays are missing');

  const studyOrigin = new URL(studyHubBaseUrl).origin;
  if (requestOrigin !== studyOrigin) {
    const allowOrigin = response.headers.get('access-control-allow-origin');
    assert.ok(
      allowOrigin === '*' || allowOrigin === requestOrigin,
      `Cross-origin catalog response does not allow Kani origin ${requestOrigin}`,
    );
  }
  return value;
});

for (const subjectId of expectedSubjects) {
  assert.ok(catalog.subjects.some((subject) => subject.id === subjectId), `Published catalog is missing subject ${subjectId}`);
}

const expectedSubjectSet = new Set(expectedSubjects);
const scopedTopics = catalog.topics.filter((topic) => expectedSubjectSet.size === 0 || expectedSubjectSet.has(topic.subjectId));
const scopedTopicIds = new Set(scopedTopics.map((topic) => topic.id));
const scopedPages = catalog.pages.filter((page) => scopedTopicIds.has(page.topicId));

assert.ok(scopedTopics.length > 0, 'Production Learn scope contains no published topics');
assert.ok(scopedPages.length > 0, 'Production Learn scope contains no published pages');

const scopedPageIds = new Set(scopedPages.map((page) => page.id));
for (const topic of scopedTopics) {
  assert.ok(topic.pageRefs.some((pageId) => scopedPageIds.has(pageId)), `Scoped topic ${topic.id} has no resolvable page references`);
}
for (const page of scopedPages) {
  assert.ok(typeof page.contentUrl === 'string' && page.contentUrl.length > 0, `Page ${page.id} has no contentUrl`);
  assert.ok(typeof page.learnerUrl === 'string' && page.learnerUrl.length > 0, `Page ${page.id} has no learnerUrl`);
}

let maxStructuredQuestions = 0;
const pagesToProbe = scopedPages.slice(0, 3);
for (const pageMeta of pagesToProbe) {
  await retry(`Study-Hub page ${pageMeta.id}`, async () => {
    const pageUrl = joinBase(studyHubBaseUrl, pageMeta.contentUrl);
    const { value: page } = await fetchJson(withCacheBust(pageUrl));
    assert.equal(page.id, pageMeta.id, `Page id mismatch for ${pageMeta.id}`);
    assert.equal(page.topicId, pageMeta.topicId, `Topic id mismatch for ${pageMeta.id}`);
    const questions = Array.isArray(page.questions) ? page.questions : [];
    maxStructuredQuestions = Math.max(maxStructuredQuestions, questions.length);
    if (questions.length > 0) {
      const ids = questions.map((question) => question?.id).filter(Boolean);
      assert.equal(new Set(ids).size, questions.length, `Structured page ${pageMeta.id} has missing or duplicate question IDs`);
      assert.ok(Array.isArray(pageMeta.skillIds) && pageMeta.skillIds.length > 0, `Structured page ${pageMeta.id} has no catalog skillIds`);
    }
  }, 6, 3000);
}

if (expectedMinStructuredQuestions > 0) {
  assert.ok(
    maxStructuredQuestions >= expectedMinStructuredQuestions,
    `Production Learn scope exposes at most ${maxStructuredQuestions} structured questions; expected at least ${expectedMinStructuredQuestions}`,
  );
}

const firstLearnerUrl = joinBase(studyHubBaseUrl, scopedPages[0].learnerUrl);
await retry('Study-Hub learner route', async () => {
  const { text } = await fetchText(withCacheBust(firstLearnerUrl));
  assert.match(text, /<html|<!doctype/i, 'Study-Hub learner route did not return an HTML app shell');
}, 6, 3000);

// Phase 3: prove the deployed print/QR → Kani mission → return-task seam.
assert.match(primaryMissionToken, /^[A-Z0-9]{8}$/, 'Primary fraction mission token must remain opaque');
const resolverUrl = joinBase(studyHubBaseUrl, '/primary/missions/resolver.json');
const resolver = await retry('Primary mission resolver', async () => {
  const { value } = await fetchJson(withCacheBust(resolverUrl));
  const route = value?.[primaryMissionToken];
  assert.ok(route, `Primary resolver is missing ${primaryMissionToken}`);
  assert.equal(route.missionId, primaryMissionId, 'Primary resolver mission identity drifted');
  assert.match(route.missionPath, /^\/primary\/missions\//);
  assert.match(route.contentPath, /^\/primary\/fractions\//);
  assert.match(route.returnTaskPath, /^\/primary\/fractions\//);
  assert.match(route.delayedRetrievalTaskPath, /^\/primary\/fractions\//);
  assert.equal(route.returnLearnerPath, '/primary/return.html');
  const serialized = JSON.stringify(route).toLowerCase();
  for (const forbidden of ['studentid', 'answerindex', 'correctanswer', 'masterystate', 'teacherdecision']) {
    assert.equal(serialized.includes(forbidden), false, `Primary resolver leaked ${forbidden}`);
  }
  return value;
}, 12, 5000);

const primaryRoute = resolver[primaryMissionToken];
const missionUrl = joinBase(studyHubBaseUrl, primaryRoute.missionPath);
const mission = await retry('Primary fraction mission', async () => {
  const { value } = await fetchJson(withCacheBust(missionUrl));
  assert.equal(value.missionId, primaryMissionId);
  assert.equal(value.learningEpisodeId, primaryLearningEpisodeId);
  assert.deepEqual(value.learningObjectIds, [primaryLearningObjectId]);
  assert.equal(value.launchPolicy?.gate, 'ATTEMPT_NOT_SCORE');
  assert.equal(value.timerPolicy, 'OFF');
  assert.equal(value.completionPolicy?.means, 'ACTIVITY_COMPLETED');
  assert.equal(value.returnPolicy?.required, true);
  assert.equal(value.returnPolicy?.endlessGameChain, false);
  assert.ok(Array.isArray(value.questionRefs) && value.questionRefs.length >= 4 && value.questionRefs.length <= 6, 'Primary mission must use 4-6 canonical questions');
  return value;
});

const contentUrl = joinBase(studyHubBaseUrl, primaryRoute.contentPath);
const primaryContent = await retry('Primary fraction canonical content', async () => {
  const { value } = await fetchJson(withCacheBust(contentUrl));
  const questions = Array.isArray(value.questions) ? value.questions : [];
  const questionIds = new Set(questions.map((question) => question.id));
  for (const ref of mission.questionRefs) {
    const questionId = typeof ref === 'string' ? ref : ref?.questionId;
    assert.ok(questionId && questionIds.has(questionId), `Mission question ${questionId || '(missing)'} is absent from canonical content`);
  }
  const missionIds = new Set(mission.questionRefs.map((ref) => typeof ref === 'string' ? ref : ref?.questionId));
  assert.equal(missionIds.has(primaryReturnQuestionId), false, 'Independent return question leaked into game mission');
  assert.equal(missionIds.has(primaryDelayedQuestionId), false, 'Delayed retrieval question leaked into game mission');
  return value;
});
assert.ok(primaryContent.questions.some((question) => question.id === primaryReturnQuestionId));
assert.ok(primaryContent.questions.some((question) => question.id === primaryDelayedQuestionId));

const launchArtifactUrl = joinBase(studyHubBaseUrl, `/primary/missions/${primaryMissionToken}.launch.json`);
const launchArtifact = await retry('Primary launch artifact', async () => {
  const { value } = await fetchJson(withCacheBust(launchArtifactUrl));
  assert.equal(value.opaqueId, primaryMissionToken);
  assert.equal(value.targetUrl, `${kaniAppUrl}#/primary/m/${primaryMissionToken}`);
  assert.equal(value.qrAssetPath, `/primary/fractions/${primaryMissionToken}-qr.svg`);
  assert.equal(value.returnLearnerPath, '/primary/return.html');
  const serialized = JSON.stringify(value).toLowerCase();
  for (const forbidden of ['studentid', 'answerindex', 'correctanswer', 'masterystate', 'teacherdecision']) {
    assert.equal(serialized.includes(forbidden), false, `Primary launch artifact leaked ${forbidden}`);
  }
  return value;
});

await retry('Primary printable QR', async () => {
  const { text } = await fetchText(withCacheBust(joinBase(studyHubBaseUrl, launchArtifact.qrAssetPath)));
  assert.match(text, /<svg/i, 'Printable Primary QR is not SVG');
  assert.match(text, new RegExp(primaryMissionToken), 'Printable Primary QR metadata lost the opaque mission token');
});

const returnUrl = `${joinBase(studyHubBaseUrl, launchArtifact.returnLearnerPath)}?mission=${encodeURIComponent(primaryMissionToken)}`;
await retry('Primary child return page', async () => {
  const { text } = await fetchText(`${returnUrl}&${cacheBust()}`);
  assert.match(text, /Back from the game/i, 'Return page is not the child-facing fraction page');
  assert.match(text, /Riya colours 4\/6 of a strip/i, 'Return page lost the independent canonical question');
  assert.match(text, /NOT_YET_TESTED/, 'Return page lost the delayed-retention boundary');
  assert.match(text, /3–7 days later/, 'Return page lost the delayed retrieval window');
  assert.doesNotMatch(text, /each third can be split into two sixths/i, 'Return page exposed the canonical model answer');
});

console.log('Production integration smoke passed');
console.log(`Kani: ${kaniAppUrl}`);
console.log(`Study-Hub catalog: ${catalogUrl}`);
console.log(`Learn enabled: ${manifest.learnEnabled}`);
console.log(`Practice enabled: ${manifest.practiceEnabled}`);
console.log(`Scoped subjects: ${manifest.allowedSubjects.join(', ') || '(all)'}`);
console.log(`Scoped topics/pages: ${scopedTopics.length}/${scopedPages.length}`);
console.log(`Maximum structured questions on probed page: ${maxStructuredQuestions}`);
console.log(`Primary fraction mission: ${launchArtifact.targetUrl}`);
console.log(`Primary return page: ${returnUrl}`);
