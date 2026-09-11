import { describe, expect, it } from 'vitest';
import type { PrimaryMissionBundle } from './PrimaryMissionClient';
import { buildPrimaryReturnUrl, primaryMissionCopy } from './PrimaryMissionPresentation';

function bundle(renderer: string, subjectId: string, returnLearnerPath: string): PrimaryMissionBundle {
  return {
    opaqueId: renderer === 'inference-investigator' ? 'P4EI7Q2K' : 'P4FE7K2Q',
    route: {
      missionId: renderer === 'inference-investigator' ? 'KM-G4-ENG-INFERENCE-001' : 'KM-G4-FRAC-EQUIV-001',
      renderer,
      missionPath: '/primary/missions/test.json',
      contentPath: '/primary/test/content.json',
      returnTaskPath: '/primary/test/return.json',
      delayedRetrievalTaskPath: '/primary/test/delayed.json',
      returnLearnerPath,
    },
    mission: {
      transportVersion: '1.0',
      semanticRef: {
        semanticAuthority: 'reallaksh19/Common',
        semanticVersion: '1.0',
        sourceCommit: '00ef138bfc69c9ec062c7cddcc53a8f40a1a4f08',
        schemaPath: 'Primary/Architecture/contracts/v1/primary-learning-semantics.schema.json',
        schemaGitBlobSha: 'df84bc3ae4545bff2fff7b52fb1538779f00c55c',
      },
      missionId: renderer === 'inference-investigator' ? 'KM-G4-ENG-INFERENCE-001' : 'KM-G4-FRAC-EQUIV-001',
      learningEpisodeId: 'EP-TEST',
      learningObjectIds: ['LO-TEST'],
      purposeRef: 'REPRESENTATION_SHIFT',
      evidenceGoalRefs: ['observable-evidence'],
      questionRefs: [{ questionId: 'Q1' }, { questionId: 'Q2' }, { questionId: 'Q3' }, { questionId: 'Q4' }],
      rendererPreferences: [renderer],
      supportPolicy: { startingConceptualSupportLevel: 'H0', allowAccessAdjustments: true },
      timerPolicy: 'OFF',
      launchPolicy: { gate: 'ATTEMPT_NOT_SCORE' },
      completionPolicy: { means: 'ACTIVITY_COMPLETED', minimumAttempts: 4 },
      returnPolicy: { required: true, activityId: 'RETURN', endlessGameChain: false },
    },
    questions: [{ subjectId } as PrimaryMissionBundle['questions'][number]],
    returnTask: {
      activityId: 'RETURN',
      learningEpisodeId: 'EP-TEST',
      learningObjectIds: ['LO-TEST'],
      questionId: 'RETURN-Q',
    },
    delayedRetrievalTask: {
      activityId: 'DELAYED',
      learningEpisodeId: 'EP-TEST',
      learningObjectIds: ['LO-TEST'],
      questionId: 'DELAYED-Q',
      status: 'NOT_YET_TESTED',
      earliestDays: 3,
      latestDays: 7,
    },
  };
}

describe('PrimaryMissionPresentation', () => {
  it('uses the English learner return path and Inference Investigator copy', () => {
    const english = bundle('inference-investigator', 'english', '/primary/english/inference-return.html');
    const copy = primaryMissionCopy(english);
    expect(copy.title).toBe('Inference Investigator');
    expect(copy.returnBody).toMatch(/answer, a text clue, and the connection/i);
    expect(copy.returnButton).toMatch(/reading page/i);
    expect(buildPrimaryReturnUrl('https://study.example.test/', english.route.returnLearnerPath, english.opaqueId))
      .toBe('https://study.example.test/primary/english/inference-return.html?mission=P4EI7Q2K');
  });

  it('preserves the existing fraction return route and copy', () => {
    const fraction = bundle('fraction-frenzy', 'mathematics', '/primary/return.html');
    const copy = primaryMissionCopy(fraction);
    expect(copy.title).toBe('Fraction Mission');
    expect(copy.returnButton).toMatch(/fraction page/i);
    expect(buildPrimaryReturnUrl('https://study.example.test', fraction.route.returnLearnerPath, fraction.opaqueId))
      .toBe('https://study.example.test/primary/return.html?mission=P4FE7K2Q');
  });

  it('rejects a return path outside the Primary publication boundary', () => {
    expect(() => buildPrimaryReturnUrl('https://study.example.test', '/elsewhere/return.html', 'P4EI7Q2K'))
      .toThrow(/under \/primary\//i);
  });
});
