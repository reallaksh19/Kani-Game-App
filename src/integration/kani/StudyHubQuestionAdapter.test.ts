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

  it('adapts the legacy answer shapes present in published Study-Hub pages', () => {
    const result = adaptStudyHubPageQuestions(page([
      {
        id: 'legacy-mcq',
        type: 'mcq',
        category: 'MCQ',
        prompt: 'Which option is correct?',
        options: ['First', 'The exact answer text', 'Third'],
        answer: 'The exact answer text',
      },
      {
        id: 'legacy-tf',
        type: 'true_false',
        category: 'true/false',
        prompt: 'This statement is false.',
        answer: 'False',
      },
      {
        id: 'legacy-short',
        type: 'short_answer',
        category: 'short answer',
        prompt: 'Give the answer.',
        answer: 'Published Study-Hub answer text',
      },
      {
        id: 'legacy-multi',
        type: 'multi_select',
        prompt: 'Choose the exact text answers.',
        options: ['Alpha', 'Beta', 'Gamma'],
        answers: ['Alpha', 'Gamma'],
      },
    ]), meta);

    expect(result.unsupported).toEqual([]);
    expect(result.questions[0]).toMatchObject({ type: 'mcq', answerIndex: 1, cognitiveDemand: 'MCQ' });
    expect(result.questions[1]).toMatchObject({ type: 'true_false', answer: false });
    expect(result.questions[2]).toMatchObject({ type: 'short_answer', acceptedAnswers: ['Published Study-Hub answer text'] });
    expect(result.questions[3]).toMatchObject({ type: 'multi_select', answerIndexes: [0, 2] });
  });

  it('maps numeric, sequence and matching questions into the second-wave runtime', () => {
    const result = adaptStudyHubPageQuestions(page([
      { id: 'numeric', type: 'numeric', prompt: 'What is 10 / 4?', answer: 2.5, tolerance: 0.01, unit: 'kg' },
      { id: 'sequence', type: 'sequence_order', prompt: 'Order the steps.', items: ['First', 'Second', 'Third'], correctOrder: [1, 2, 0] },
      {
        id: 'match',
        type: 'match_following',
        prompt: 'Match each item.',
        leftItems: [{ id: 'l1', text: 'Half' }, { id: 'l2', text: 'Quarter' }],
        rightItems: [{ id: 'r1', text: '1/2' }, { id: 'r2', text: '1/4' }],
        correctPairs: [['l1', 'r1'], ['l2', 'r2']],
      },
    ]), meta);

    expect(result.unsupported).toEqual([]);
    expect(result.questions[0]).toMatchObject({ type: 'numeric', answer: 2.5, tolerance: 0.01, unit: 'kg' });
    expect(result.questions[1]).toMatchObject({ type: 'sequence_order', correctOrder: [1, 2, 0] });
    expect(result.questions[2]).toMatchObject({ type: 'match_following', correctPairs: [['l1', 'r1'], ['l2', 'r2']] });
  });

  it('maps external activity references without discarding extension metadata', () => {
    const result = adaptStudyHubPageQuestions(page([
      {
        id: 'external-1',
        type: 'interactive_external',
        prompt: 'Explore the fraction game.',
        skillIds: ['skill_fraction-game'],
        externalRef: {
          activityId: 'fraction-game-1',
          launchUrl: '/activities/fractions/index.html',
          presentation: 'iframe',
        },
      },
    ]), meta);

    expect(result.unsupported).toEqual([]);
    expect(result.questions[0]).toMatchObject({
      id: 'external-1',
      type: 'interactive_external',
      prompt: 'Explore the fraction game.',
      externalRef: {
        activityId: 'fraction-game-1',
        launchUrl: '/activities/fractions/index.html',
        presentation: 'iframe',
      },
    });
    expect(result.questions[0].skillIds).toEqual(expect.arrayContaining(['skill_fraction-comparison', 'skill_fraction-game']));
  });

  it('refuses missing stable ids and objectively unscorable/invalid types instead of inventing answers', () => {
    const result = adaptStudyHubPageQuestions(page([
      { type: 'mcq', prompt: 'No id', options: ['a', 'b'], answer: 0 },
      { id: 'q-long', type: 'long_answer', prompt: 'Explain why.', modelAnswer: 'Because...' },
      { id: 'q-bad', type: 'mcq', prompt: 'Bad answer', options: ['a', 'b'], answer: 'Z' },
      { id: 'bad-seq', type: 'sequence_order', prompt: 'Order', items: ['a', 'b'], correctOrder: [0, 0] },
      { id: 'bad-external', type: 'interactive_external', externalRef: { activityId: 'missing-url' } },
    ]), meta);

    expect(result.questions).toHaveLength(0);
    expect(result.unsupported).toHaveLength(5);
    expect(result.unsupported[0].reason).toMatch(/stable question id/);
    expect(result.unsupported[1].reason).toMatch(/not enabled|objectively scorable/);
    expect(result.unsupported[2].reason).toMatch(/valid answer/);
    expect(result.unsupported[3].reason).toMatch(/complete unique correctOrder/);
    expect(result.unsupported[4].reason).toMatch(/activityId.*launchUrl/);
  });

  it('falls back to page metadata for normalized difficulty and preserves unique answer indexes', () => {
    const result = adaptStudyHubPageQuestions(page([
      { id: 'q6', type: 'multi_select', prompt: 'Pick all', options: ['a', 'b', 'c'], answers: [0, 0, 2], difficulty: 'beginner' },
    ]), meta);

    expect(result.questions[0]).toMatchObject({ difficulty: 'medium', answerIndexes: [0, 2] });
  });
});
