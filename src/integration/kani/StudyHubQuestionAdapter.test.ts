import { describe, expect, it } from 'vitest';
import { KaniCatalogPage, StudyHubPageDocument } from './contracts';
import { adaptStudyHubPageQuestions } from './StudyHubQuestionAdapter';

const meta: KaniCatalogPage = {
  id: 'page_fraction_intro',
  topicId: 'topic_fractions',
  subjectId: 'mathematics',
  title: 'Fractions',
  activityType: 'lesson',
  contentUrl: '/mathematics/fractions/pages/intro.json',
  grade: 'Grade 4',
  difficulty: 'medium',
  skillIds: ['skill_fraction-comparison'],
  conceptTags: ['fractions'],
};

function page(questions: unknown[]): StudyHubPageDocument {
  return {
    id: meta.id,
    topicId: meta.topicId,
    title: meta.title,
    difficulty: 'medium',
    conceptTags: ['equivalent-fractions'],
    questions,
  };
}

describe('adaptStudyHubPageQuestions', () => {
  it('maps first-wave Study-Hub question types into Kani contracts', () => {
    const result = adaptStudyHubPageQuestions(page([
      { id: 'q1', type: 'mcq', prompt: 'Pick one', options: ['A1', 'A2'], answer: 'B', difficulty: 'easy', supportHint: 'Look closely', explanation: 'B is correct.' },
      { id: 'q2', type: 'true_false', prompt: 'True?', answer: true },
      { id: 'q3', type: 'short_answer', prompt: 'Name it', modelAnswer: 'fraction' },
      { id: 'q4', type: 'fill_in_blank', prompt: '1/2 = __/4', answer: 2 },
      { id: 'q5', type: 'multi_select', prompt: 'Pick all', options: ['x', 'y', 'z'], answers: [0, 2] },
    ]), meta);

    expect(result.unsupported).toEqual([]);
    expect(result.questions.map((question) => question.type)).toEqual(['mcq', 'true_false', 'short_answer', 'fill_in_blank', 'multi_select']);
    expect(result.questions[0]).toMatchObject({
      id: 'q1',
      type: 'mcq',
      answerIndex: 1,
      subjectId: 'mathematics',
      topicId: 'topic_fractions',
      pageId: 'page_fraction_intro',
      difficulty: 'easy',
      hint: 'Look closely',
    });
    expect(result.questions[0].skillIds).toContain('skill_fraction-comparison');
    expect(result.questions[0].conceptTags).toEqual(expect.arrayContaining(['fractions', 'equivalent-fractions']));
  });

  it('refuses missing stable ids and unsupported types instead of inventing or mis-scoring them', () => {
    const result = adaptStudyHubPageQuestions(page([
      { type: 'mcq', prompt: 'No id', options: ['a', 'b'], answer: 0 },
      { id: 'q-seq', type: 'sequence_order', prompt: 'Order', items: ['a', 'b'], correctOrder: [0, 1] },
      { id: 'q-bad', type: 'mcq', prompt: 'Bad answer', options: ['a', 'b'], answer: 'Z' },
    ]), meta);

    expect(result.questions).toHaveLength(0);
    expect(result.unsupported).toHaveLength(3);
    expect(result.unsupported[0].reason).toMatch(/stable question id/);
    expect(result.unsupported[1].reason).toMatch(/not enabled/);
    expect(result.unsupported[2].reason).toMatch(/valid answer/);
  });

  it('falls back to page metadata for normalized difficulty and preserves unique answer indexes', () => {
    const result = adaptStudyHubPageQuestions(page([
      { id: 'q6', type: 'multi_select', prompt: 'Pick all', options: ['a', 'b', 'c'], answers: [0, 0, 2], difficulty: 'beginner' },
    ]), meta);

    expect(result.questions[0]).toMatchObject({ difficulty: 'medium', answerIndexes: [0, 2] });
  });
});
