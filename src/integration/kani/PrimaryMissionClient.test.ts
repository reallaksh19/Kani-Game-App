import { describe, expect, it, vi } from 'vitest';
import { PrimaryMissionClient, PrimaryMissionError } from './PrimaryMissionClient';

const question = (id: string) => ({
  schemaVersion: '1.0',
  id,
  subjectId: 'mathematics',
  topicId: 'topic_grade4-fractions',
  pageId: 'page_grade4-fractions-primary-equivalence',
  grade: 'Grade 4',
  skillIds: ['skill_fraction-equivalence'],
  conceptTags: ['equivalent-fractions'],
  difficulty: 'medium',
  curriculumTags: [],
  type: 'true_false',
  prompt: `${id}: equivalent fractions?`,
  answer: true,
});

const questionIds = Array.from({ length: 6 }, (_, index) => `fraction-equiv-q-10${index + 1}`);
const semanticRef = {
  semanticAuthority: 'reallaksh19/Common',
  semanticVersion: '1.0',
  sourceCommit: 'b558d33238b5edbc4dc37b7701edab2c5109242d',
  schemaPath: 'Primary/Architecture/contracts/v1/primary-learning-semantics.schema.json',
  schemaGitBlobSha: '2f6d95c1cdc8801205afef41beff3e818ae92be1',
};

const route = {
  missionId: 'KM-G4-FRAC-EQUIV-001',
  renderer: 'fraction-frenzy',
  missionPath: '/primary/missions/KM-G4-FRAC-EQUIV-001.json',
  contentPath: '/primary/fractions/grade4-fraction-equivalence.content.json',
  returnTaskPath: '/primary/fractions/return-task.json',
  delayedRetrievalTaskPath: '/primary/fractions/delayed-retrieval-task.json',
};

const mission = {
  transportVersion: '1.0',
  semanticRef,
  missionId: route.missionId,
  learningEpisodeId: 'EP-G4-FRAC-EQUIV-001',
  learningObjectIds: ['MATH-FRAC-EQUIVALENCE'],
  purposeRef: 'REPRESENTATION_SHIFT',
  evidenceGoalRefs: ['recognise_equivalent_fractions'],
  questionRefs: questionIds.map((questionId) => ({ questionId })),
  rendererPreferences: ['fraction-frenzy'],
  supportPolicy: { startingConceptualSupportLevel: 'H0', allowAccessAdjustments: true },
  timerPolicy: 'OFF',
  launchPolicy: { gate: 'ATTEMPT_NOT_SCORE' },
  completionPolicy: { means: 'ACTIVITY_COMPLETED', minimumAttempts: 4 },
  returnPolicy: { required: true, activityId: 'fraction-equiv-return-001', endlessGameChain: false },
};

const returnTask = {
  activityId: 'fraction-equiv-return-001',
  learningEpisodeId: mission.learningEpisodeId,
  learningObjectIds: mission.learningObjectIds,
  questionId: 'fraction-equiv-return-q-201',
  purpose: 'INDEPENDENT_TRANSFER',
};

const delayedTask = {
  activityId: 'fraction-equiv-delayed-001',
  learningEpisodeId: mission.learningEpisodeId,
  learningObjectIds: mission.learningObjectIds,
  questionId: 'fraction-equiv-delayed-q-301',
  status: 'NOT_YET_TESTED',
  earliestDays: 3,
  latestDays: 7,
};

function mockFetch(overrides: Record<string, unknown> = {}) {
  const payloads: Record<string, unknown> = {
    '/primary/missions/resolver.json': { P4FE7K2Q: route },
    [route.missionPath]: mission,
    [route.contentPath]: { questions: questionIds.map(question) },
    [route.returnTaskPath]: returnTask,
    [route.delayedRetrievalTaskPath]: delayedTask,
    ...overrides,
  };

  return vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const body = payloads[url.pathname];
    if (body === undefined) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
}

describe('PrimaryMissionClient', () => {
  it('resolves one opaque mission into six canonical questions and fresh return/retrieval tasks', async () => {
    const fetchFn = mockFetch();
    const client = new PrimaryMissionClient({ baseUrl: 'https://study.example.test', fetchFn });
    const bundle = await client.loadByOpaqueId('p4fe7k2q');

    expect(bundle.opaqueId).toBe('P4FE7K2Q');
    expect(bundle.route.renderer).toBe('fraction-frenzy');
    expect(bundle.mission.launchPolicy.gate).toBe('ATTEMPT_NOT_SCORE');
    expect(bundle.mission.completionPolicy.means).toBe('ACTIVITY_COMPLETED');
    expect(bundle.mission.timerPolicy).toBe('OFF');
    expect(bundle.questions.map((item) => item.id)).toEqual(questionIds);
    expect(bundle.returnTask.questionId).toBe('fraction-equiv-return-q-201');
    expect(bundle.delayedRetrievalTask.status).toBe('NOT_YET_TESTED');
    expect(bundle.delayedRetrievalTask.earliestDays).toBe(3);
    expect(bundle.delayedRetrievalTask.latestDays).toBe(7);
  });

  it('rejects answer/mastery/Teacher Runtime judgement embedded in mission transport', async () => {
    const fetchFn = mockFetch({
      [route.missionPath]: { ...mission, diagnosis: 'reteach fractions' },
    });
    const client = new PrimaryMissionClient({ baseUrl: 'https://study.example.test', fetchFn });
    await expect(client.loadByOpaqueId('P4FE7K2Q')).rejects.toThrow(PrimaryMissionError);
  });

  it('fails closed when a canonical mission question is missing from Study-Hub content', async () => {
    const fetchFn = mockFetch({
      [route.contentPath]: { questions: questionIds.slice(0, 5).map(question) },
    });
    const client = new PrimaryMissionClient({ baseUrl: 'https://study.example.test', fetchFn });
    await expect(client.loadByOpaqueId('P4FE7K2Q')).rejects.toThrow(/missing canonical question/);
  });

  it('rejects return-task answer leakage into the game question set', async () => {
    const leakingMission = {
      ...mission,
      questionRefs: [...mission.questionRefs.slice(0, 5), { questionId: returnTask.questionId }],
    };
    const fetchFn = mockFetch({
      [route.missionPath]: leakingMission,
      [route.contentPath]: { questions: [...questionIds.slice(0, 5).map(question), question(returnTask.questionId)] },
    });
    const client = new PrimaryMissionClient({ baseUrl: 'https://study.example.test', fetchFn });
    await expect(client.loadByOpaqueId('P4FE7K2Q')).rejects.toThrow(/must not be leaked/);
  });

  it('rejects score-gated or mastery-labelled mission policy', async () => {
    const clientA = new PrimaryMissionClient({
      baseUrl: 'https://study.example.test',
      fetchFn: mockFetch({ [route.missionPath]: { ...mission, launchPolicy: { gate: 'SCORE_80' } } }),
    });
    await expect(clientA.loadByOpaqueId('P4FE7K2Q')).rejects.toThrow(/ATTEMPT_NOT_SCORE/);

    const clientB = new PrimaryMissionClient({
      baseUrl: 'https://study.example.test',
      fetchFn: mockFetch({ [route.missionPath]: { ...mission, completionPolicy: { means: 'SKILL_MASTERED' } } }),
    });
    await expect(clientB.loadByOpaqueId('P4FE7K2Q')).rejects.toThrow(/cannot declare mastery/);
  });
});
