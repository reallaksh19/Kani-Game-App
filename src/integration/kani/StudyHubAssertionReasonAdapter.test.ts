import { describe, expect, it } from 'vitest';
import { KaniCatalogPage, StudyHubPageDocument } from './contracts';
import { adaptStudyHubPageQuestions } from './StudyHubQuestionAdapter';

const meta: KaniCatalogPage = {
  id: 'page_number_system',
  topicId: 'topic_number_system',
  subjectId: 'mathematics',
  title: 'Number System',
  activityType: 'lesson',
  contentUrl: '/mathematics/number-system/pages/assertion.json',
  difficulty: 'medium',
  skillIds: [],
  conceptTags: ['number-system'],
};

function page(answerPattern: string): StudyHubPageDocument {
  return {
    id: meta.id,
    topicId: meta.topicId,
    title: meta.title,
    questions: [{
      id: 'ar-1',
      type: 'assertion_reason',
      assertion: '√2 is irrational.',
      reason: 'It cannot be represented exactly as p/q.',
      answerPattern,
      explanation: 'The reason states the defining rational-number test.',
    }],
  };
}

describe('Study-Hub assertion/reason adapter', () => {
  it('maps the four Study-Hub answerPattern ids into stable Kani option indexes', () => {
    const patterns = [
      'both_true_reason_explains_assertion',
      'both_true_reason_not_explain',
      'assertion_true_reason_false',
      'assertion_false_reason_true',
    ];

    patterns.forEach((pattern, expectedIndex) => {
      const result = adaptStudyHubPageQuestions(page(pattern), meta);
      expect(result.unsupported).toEqual([]);
      expect(result.questions[0]).toMatchObject({
        type: 'assertion_reason',
        assertion: '√2 is irrational.',
        reason: 'It cannot be represented exactly as p/q.',
        answerIndex: expectedIndex,
      });
      if (result.questions[0].type === 'assertion_reason') {
        expect(result.questions[0].options).toHaveLength(4);
      }
    });
  });

  it('refuses unknown free-form patterns rather than guessing correctness', () => {
    const result = adaptStudyHubPageQuestions(page('something_custom'), meta);
    expect(result.questions).toEqual([]);
    expect(result.unsupported[0].reason).toMatch(/recognized Study-Hub answerPattern/);
  });
});
