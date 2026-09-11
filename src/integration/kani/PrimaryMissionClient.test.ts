import { describe, expect, it, vi } from 'vitest';
import { PrimaryMissionClient, PrimaryMissionError } from './PrimaryMissionClient';

const semanticRef = {
  semanticAuthority: 'reallaksh19/Common',
  semanticVersion: '1.0',
  sourceCommit: '00ef138bfc69c9ec062c7cddcc53a8f40a1a4f08',
  schemaPath: 'Primary/Architecture/contracts/v1/primary-learning-semantics.schema.json',
  schemaGitBlobSha: 'df84bc3ae4545bff2fff7b52fb1538779f00c55c',
};

const fractionQuestionIds = Array.from({ length: 6 }, (_, index) => `fraction-equiv-q-10${index + 1}`);
const englishQuestionIds = Array.from({ length: 6 }, (_, index) => `eng-inference-q-10${index + 1}`);

const fractionQuestion = (id: string) => ({
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

const englishQuestion = (id: string) => ({
  schemaVersion: '1.0',
  id,
  subjectId: 'english',
  topicId: 'topic_grade4-reading-inference',
  pageId: 'page_grade4-reading-inference-primary',
  grade: 'Grade 4',
  skillIds: ['skill_inference-text-evidence'],
  conceptTags: ['inference', 'text-evidence'],
  difficulty: 'medium',
  curriculumTags: [],
  type: 'mcq',
  prompt: `${id}: what can you infer?`,
  options: ['Supported answer', 'Distractor A', 'Distractor B', 'Distractor C'],
  answerIndex: 0,
});

const fractionRoute = {
  missionId: 'KM-G4-FRAC-EQUIV-001',
  renderer: 'fraction-frenzy',
  missionPath: '/primary/missions/KM-G4-FRAC-EQUIV-001.json',
  contentPath: '/primary/fractions/grade4-fraction-equivalence.content.json',
  returnTaskPath: '/primary/fractions/return-task.json',
  delayedRetrievalTaskPath: '/primary/fractions/delayed-retrieval-task.json',
  returnLearnerPath: '/primary/return.html',
};

const englishRoute = {
  missionId: 'KM-G4-ENG-INFERENCE-001',
  renderer: 'inference-investigator',
  missionPath: '/primary/missions/KM-G4-ENG-INFERENCE-001.json',
  contentPath: '/primary/english/grade4-inference-text-evidence.content.json',
  returnTaskPath: '/primary/english/inference-return-task.json',
  delayedRetrievalTaskPath: '/primary/english/inference-delayed-retrieval-task.json',
  returnLearnerPath: '/primary/english/inference-return.html',
};

function missionFor({
  route,
  episodeId,
  learningObjectId,
  questionIds,
  renderer,
  returnActivityId,
}: {
  route: typeof fractionRoute;
  episodeId: string;
  learningObjectId: string;
  questionIds: string[];
  renderer: string;
  returnActivityId: string;
}) {
  return {
    transportVersion: '1.0',
    semanticRef,
    missionId: route.missionId,
    learningEpisodeId: episodeId,
    learningObjectIds: [learningObjectId],
    purposeRef: 'REPRESENTATION_SHIFT',
    evidenceGoalRefs: ['observable_learning_evidence'],
    questionRefs: questionIds.map((questionId) => ({ questionId })),
    rendererPreferences: [renderer],
    supportPolicy: { startingConceptualSupportLevel: 'H0', allowAccessAdjustments: true },
    timerPolicy: 'OFF',
    launchPolicy: { gate: 'ATTEMPT_NOT_SCORE' },
    completionPolicy: { means: 'ACTIVITY_COMPLETED', minimumAttempts: 4 },
    returnPolicy: { required: true, activityId: returnActivityId, endlessGameChain: false },
  };
}

const fractionMission = missionFor({
  route: fractionRoute,
  episodeId: 'EP-G4-FRAC-EQUIV-001',
  learningObjectId: 'MATH-FRAC-EQUIVALENCE',
  questionIds: fractionQuestionIds,
  renderer: 'fraction-frenzy',
  returnActivityId: 'fraction-equiv-return-001',
});

const englishMission = missionFor({
  route: englishRoute,
  episodeId: 'EP-G4-ENG-INFERENCE-001',
  learningObjectId: 'ENG-INFERENCE-TEXT-EVIDENCE',
  questionIds: englishQuestionIds,
  renderer: 'inference-investigator',
  returnActivityId: 'eng-inference-return-001',
});

const fractionReturnTask = {
  activityId: 'fraction-equiv-return-001',
  learningEpisodeId: fractionMission.learningEpisodeId,
  learningObjectIds: fractionMission.learningObjectIds,
  questionId: 'fraction-equiv-return-q-201',
  purpose: 'INDEPENDENT_TRANSFER',
};

const fractionDelayedTask = {
  activityId: 'fraction-equiv-delayed-001',
  learningEpisodeId: fractionMission.learningEpisodeId,
  learningObjectIds: fractionMission.learningObjectIds,
  questionId: 'fraction-equiv-delayed-q-301',
  status: 'NOT_YET_TESTED',
  earliestDays: 3,
  latestDays: 7,
};

const englishReturnTask = {
  activityId: 'eng-inference-return-001',
  learningEpisodeId: englishMission.learningEpisodeId,
  learningObjectIds: englishMission.learningObjectIds,
  questionId: 'eng-inference-return-q-201',
  requiredEvidenceParts: ['ANSWER', 'TEXT_CLUE', 'CONNECTION'],
  allowedResponseModes: ['ORAL', 'WRITTEN'],
  conceptualSupportExpected: 'H0',
};

const englishDelayedTask = {
  activityId: 'eng-inference-delayed-001',
  learningEpisodeId: englishMission.learningEpisodeId,
  learningObjectIds: englishMission.learningObjectIds,
  questionId: 'eng-inference-delayed-q-301',
  status: 'NOT_YET_TESTED',
  earliestDays: 3,
  latestDays: 7,
};

function mockFetch(overrides: Record<string, unknown> = {}) {
  const payloads: Record<string, unknown> = {
    '/primary/missions/resolver.json': {
      P4FE7K2Q: fractionRoute,
      P4EI7Q2K: englishRoute,
    },
    [fractionRoute.missionPath]: fractionMission,
    [fractionRoute.contentPath]: { questions: fractionQuestionIds.map(fractionQuestion) },
    [fractionRoute.returnTaskPath]: fractionReturnTask,
    [fractionRoute.delayedRetrievalTaskPath]: fractionDelayedTask,
    [englishRoute.missionPath]: englishMission,
    [englishRoute.contentPath]: { questions: englishQuestionIds.map(englishQuestion) },
    [englishRoute.returnTaskPath]: englishReturnTask,
    [englishRoute.delayedRetrievalTaskPath]: englishDelayedTask,
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
  it('resolves the existing fraction mission with its route-specific return page', async () => {
    const client = new PrimaryMissionClient({ baseUrl: 'https://study.example.test', fetchFn: mockFetch() });
    const bundle = await client.loadByOpaqueId('p4fe7k2q');

    expect(bundle.opaqueId).toBe('P4FE7K2Q');
    expect(bundle.route.renderer).toBe('fraction-frenzy');
    expect(bundle.route.returnLearnerPath).toBe('/primary/return.html');
    expect(bundle.questions.map((item) => item.id)).toEqual(fractionQuestionIds);
    expect(bundle.returnTask.questionId).toBe('fraction-equiv-return-q-201');
    expect(bundle.delayedRetrievalTask.status).toBe('NOT_YET_TESTED');
  });

  it('resolves the English Inference Investigator mission without importing pedagogy judgement into Kani', async () => {
    const client = new PrimaryMissionClient({ baseUrl: 'https://study.example.test', fetchFn: mockFetch() });
    const bundle = await client.loadByOpaqueId('p4ei7q2k');

    expect(bundle.opaqueId).toBe('P4EI7Q2K');
    expect(bundle.route.renderer).toBe('inference-investigator');
    expect(bundle.route.returnLearnerPath).toBe('/primary/english/inference-return.html');
    expect(bundle.mission.learningObjectIds).toEqual(['ENG-INFERENCE-TEXT-EVIDENCE']);
    expect(bundle.mission.launchPolicy.gate).toBe('ATTEMPT_NOT_SCORE');
    expect(bundle.mission.completionPolicy.means).toBe('ACTIVITY_COMPLETED');
    expect(bundle.mission.timerPolicy).toBe('OFF');
    expect(bundle.questions.map((item) => item.id)).toEqual(englishQuestionIds);
    expect(bundle.questions.every((item) => item.subjectId === 'english')).toBe(true);
    expect(bundle.returnTask.questionId).toBe('eng-inference-return-q-201');
    expect(bundle.returnTask.requiredEvidenceParts).toEqual(['ANSWER', 'TEXT_CLUE', 'CONNECTION']);
    expect(bundle.delayedRetrievalTask.status).toBe('NOT_YET_TESTED');
    expect(bundle.delayedRetrievalTask.earliestDays).toBe(3);
    expect(bundle.delayedRetrievalTask.latestDays).toBe(7);
    expect('masteryState' in bundle.mission).toBe(false);
    expect('teacherDecision' in bundle.mission).toBe(false);
  });

  it('fails closed when resolver omits the learner return path', async () => {
    const { returnLearnerPath: _removed, ...missingReturnPath } = englishRoute;
    const client = new PrimaryMissionClient({
      baseUrl: 'https://study.example.test',
      fetchFn: mockFetch({
        '/primary/missions/resolver.json': { P4EI7Q2K: missingReturnPath },
      }),
    });
    await expect(client.loadByOpaqueId('P4EI7Q2K')).rejects.toThrow(/returnLearnerPath/);
  });

  it('rejects answer/mastery/Teacher Runtime judgement embedded in mission transport', async () => {
    const client = new PrimaryMissionClient({
      baseUrl: 'https://study.example.test',
      fetchFn: mockFetch({
        [englishRoute.missionPath]: { ...englishMission, diagnosis: 'reteach inference' },
      }),
    });
    await expect(client.loadByOpaqueId('P4EI7Q2K')).rejects.toThrow(PrimaryMissionError);
  });

  it('fails closed when a canonical mission question is missing from Study-Hub content', async () => {
    const client = new PrimaryMissionClient({
      baseUrl: 'https://study.example.test',
      fetchFn: mockFetch({
        [englishRoute.contentPath]: { questions: englishQuestionIds.slice(0, 5).map(englishQuestion) },
      }),
    });
    await expect(client.loadByOpaqueId('P4EI7Q2K')).rejects.toThrow(/missing canonical question/);
  });

  it('rejects return-task answer leakage into the game question set', async () => {
    const leakingMission = {
      ...englishMission,
      questionRefs: [...englishMission.questionRefs.slice(0, 5), { questionId: englishReturnTask.questionId }],
    };
    const client = new PrimaryMissionClient({
      baseUrl: 'https://study.example.test',
      fetchFn: mockFetch({
        [englishRoute.missionPath]: leakingMission,
        [englishRoute.contentPath]: {
          questions: [...englishQuestionIds.slice(0, 5).map(englishQuestion), englishQuestion(englishReturnTask.questionId)],
        },
      }),
    });
    await expect(client.loadByOpaqueId('P4EI7Q2K')).rejects.toThrow(/must not be leaked/);
  });

  it('rejects score-gated or mastery-labelled mission policy', async () => {
    const clientA = new PrimaryMissionClient({
      baseUrl: 'https://study.example.test',
      fetchFn: mockFetch({ [englishRoute.missionPath]: { ...englishMission, launchPolicy: { gate: 'SCORE_80' } } }),
    });
    await expect(clientA.loadByOpaqueId('P4EI7Q2K')).rejects.toThrow(/ATTEMPT_NOT_SCORE/);

    const clientB = new PrimaryMissionClient({
      baseUrl: 'https://study.example.test',
      fetchFn: mockFetch({ [englishRoute.missionPath]: { ...englishMission, completionPolicy: { means: 'SKILL_MASTERED' } } }),
    });
    await expect(clientB.loadByOpaqueId('P4EI7Q2K')).rejects.toThrow(/cannot declare mastery/);
  });
});
