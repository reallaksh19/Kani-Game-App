import { describe, expect, it } from 'vitest';
import { KaniQuestion } from '../../integration/kani/contracts';
import { evaluateQuestionAnswer } from './AnswerEvaluator';
import { QuestionSessionEngine } from './QuestionSessionEngine';
import { selectSessionQuestions } from './sessionSelection';

const base = {
  schemaVersion: '1.0' as const,
  subjectId: 'mathematics',
  topicId: 'fractions',
  skillIds: ['compare-fractions'],
  conceptTags: ['fractions'],
  curriculumTags: [],
  hint: 'Compare carefully.',
  explanation: 'Use equivalent fractions.',
};

const questions: KaniQuestion[] = [
  {
    ...base,
    id: 'q1',
    type: 'mcq',
    prompt: 'Which is greatest?',
    options: ['1/4', '1/2', '1/3'],
    answerIndex: 1,
    difficulty: 'easy',
  },
  {
    ...base,
    id: 'q2',
    type: 'true_false',
    prompt: '1/2 is greater than 1/3.',
    answer: true,
    difficulty: 'medium',
  },
  {
    ...base,
    id: 'q3',
    type: 'short_answer',
    prompt: 'Write one half as words.',
    acceptedAnswers: ['one half', 'one-half'],
    caseSensitive: false,
    difficulty: 'hard',
  },
];

describe('sessionSelection', () => {
  it('preserves authored order and source array when Randomise is OFF', () => {
    const before = questions.map((q) => q.id);
    const selected = selectSessionQuestions(questions, { randomize: false });
    expect(selected.map((q) => q.id)).toEqual(before);
    expect(questions.map((q) => q.id)).toEqual(before);
    expect(selected).not.toBe(questions);
  });

  it('randomizes a copy when Randomise is ON', () => {
    const selected = selectSessionQuestions(questions, { randomize: true }, () => 0);
    expect(selected.map((q) => q.id)).toEqual(['q2', 'q3', 'q1']);
    expect(questions.map((q) => q.id)).toEqual(['q1', 'q2', 'q3']);
  });

  it('filters by normalized difficulty before applying limit', () => {
    expect(selectSessionQuestions(questions, { randomize: false, difficulty: 'medium', limit: 1 }).map((q) => q.id)).toEqual(['q2']);
    expect(selectSessionQuestions(questions, { randomize: false, difficulty: 'mixed', limit: 2 }).map((q) => q.id)).toEqual(['q1', 'q2']);
  });
});

describe('AnswerEvaluator', () => {
  it('supports first-wave MCQ, true/false, text and multi-select formats', () => {
    expect(evaluateQuestionAnswer(questions[0], 1)).toMatchObject({ supported: true, correct: true, partialCredit: 1 });
    expect(evaluateQuestionAnswer(questions[1], false)).toMatchObject({ supported: true, correct: false, partialCredit: 0 });
    expect(evaluateQuestionAnswer(questions[2], '  ONE   HALF ')).toMatchObject({ supported: true, correct: true });

    const multi: KaniQuestion = {
      ...base,
      id: 'multi',
      type: 'multi_select',
      prompt: 'Select even numbers.',
      options: ['2', '3', '4', '5'],
      answerIndexes: [0, 2],
      difficulty: 'medium',
    };
    expect(evaluateQuestionAnswer(multi, [0, 2])).toMatchObject({ correct: true, partialCredit: 1 });
    expect(evaluateQuestionAnswer(multi, [0])).toMatchObject({ correct: false, partialCredit: 0.5 });
    expect(evaluateQuestionAnswer(multi, [0, 1])).toMatchObject({ correct: false, partialCredit: 0 });
  });

  it('supports numeric tolerance, ordering, matching and assertion/reason', () => {
    const numeric: KaniQuestion = {
      ...base,
      id: 'numeric',
      type: 'numeric',
      prompt: 'Estimate pi.',
      answer: 3.14,
      tolerance: 0.01,
      difficulty: 'easy',
    };
    expect(evaluateQuestionAnswer(numeric, 3.145)).toMatchObject({ supported: true, correct: true, partialCredit: 1 });
    expect(evaluateQuestionAnswer(numeric, 3.2)).toMatchObject({ correct: false, partialCredit: 0 });

    const sequence: KaniQuestion = {
      ...base,
      id: 'sequence',
      type: 'sequence_order',
      prompt: 'Order the steps.',
      items: ['A', 'B', 'C'],
      correctOrder: [2, 0, 1],
      difficulty: 'medium',
    };
    expect(evaluateQuestionAnswer(sequence, [2, 0, 1])).toMatchObject({ correct: true, partialCredit: 1 });
    expect(evaluateQuestionAnswer(sequence, [2, 1, 0])).toMatchObject({ correct: false, partialCredit: 1 / 3 });

    const matching: KaniQuestion = {
      ...base,
      id: 'matching',
      type: 'match_following',
      prompt: 'Match.',
      leftItems: [{ id: 'l1', text: 'Half' }, { id: 'l2', text: 'Quarter' }],
      rightItems: [{ id: 'r1', text: '1/2' }, { id: 'r2', text: '1/4' }],
      correctPairs: [['l1', 'r1'], ['l2', 'r2']],
      difficulty: 'medium',
    };
    expect(evaluateQuestionAnswer(matching, { l1: 'r1', l2: 'r2' })).toMatchObject({ correct: true, partialCredit: 1 });
    expect(evaluateQuestionAnswer(matching, { l1: 'r1', l2: 'r1' })).toMatchObject({ correct: false, partialCredit: 0.5 });

    const assertion: KaniQuestion = {
      ...base,
      id: 'assertion',
      type: 'assertion_reason',
      assertion: 'A is true.',
      reason: 'R explains A.',
      options: ['Both true and R explains A', 'Both true but R does not explain A', 'A true R false', 'A false R true'],
      answerIndex: 0,
      difficulty: 'hard',
    };
    expect(evaluateQuestionAnswer(assertion, 0)).toMatchObject({ supported: true, correct: true, partialCredit: 1 });
  });
});

describe('QuestionSessionEngine', () => {
  it('records timing/review and emits canonical attempts for the stable studentId', () => {
    let now = Date.parse('2026-09-05T14:00:00.000Z');
    const clock = () => now;
    const engine = new QuestionSessionEngine({
      questions,
      config: { randomize: false, limit: 2, sessionId: 'session_test' },
      clock,
    });

    now += 2500;
    engine.submitAnswer(1, 1);
    now += 4000;
    engine.submitAnswer(false, 0);

    expect(engine.completed).toBe(true);
    const result = engine.buildResult({
      studentId: 'student_alpha',
      activityId: 'worksheet_fractions_1',
      activityType: 'worksheet',
      sourceApp: 'game-app',
    });

    expect(result.correctCount).toBe(1);
    expect(result.total).toBe(2);
    expect(result.accuracy).toBe(0.5);
    expect(result.totalResponseTimeMs).toBe(6500);
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts.every((attempt) => attempt.studentId === 'student_alpha')).toBe(true);
    expect(result.attempts[0]).toMatchObject({
      schemaVersion: '1.0',
      attemptId: 'session_test:q1',
      questionId: 'q1',
      responseTimeMs: 2500,
      hintsUsed: 1,
      correct: true,
    });
    expect(result.review[1]).toMatchObject({
      questionId: 'q2',
      correct: false,
      selectedAnswer: false,
      correctAnswer: true,
    });
  });

  it('records partial credit from second-wave structured questions', () => {
    const matching: KaniQuestion = {
      ...base,
      id: 'matching-session',
      type: 'match_following',
      prompt: 'Match.',
      leftItems: [{ id: 'l1', text: 'Half' }, { id: 'l2', text: 'Quarter' }],
      rightItems: [{ id: 'r1', text: '1/2' }, { id: 'r2', text: '1/4' }],
      correctPairs: [['l1', 'r1'], ['l2', 'r2']],
      difficulty: 'medium',
    };
    const engine = new QuestionSessionEngine({ questions: [matching], config: { randomize: false, sessionId: 'structured' } });
    engine.submitAnswer({ l1: 'r1', l2: 'r1' });
    const result = engine.buildResult({ studentId: 'student_alpha', activityId: 'match_demo', activityType: 'worksheet' });
    expect(result.attempts[0]).toMatchObject({ correct: false, partialCredit: 0.5 });
    expect(result.review[0]).toMatchObject({ partialCredit: 0.5, selectedAnswer: { l1: 'r1', l2: 'r1' } });
  });

  it('rejects question types without an objective runtime evaluator', () => {
    const longAnswer: KaniQuestion = {
      ...base,
      id: 'long',
      type: 'long_answer',
      prompt: 'Explain your reasoning.',
      modelAnswer: 'A model explanation.',
      difficulty: 'hard',
    };
    const engine = new QuestionSessionEngine({ questions: [longAnswer], config: { randomize: false } });
    expect(() => engine.submitAnswer('My answer')).toThrow(/not supported/);
  });

  it('requires stable student identity before producing attempts', () => {
    const engine = new QuestionSessionEngine({ questions: [questions[0]], config: { randomize: false } });
    engine.submitAnswer(1);
    expect(() => engine.buildResult({ studentId: '', activityId: 'activity', activityType: 'quiz' })).toThrow(/studentId/);
  });
});
