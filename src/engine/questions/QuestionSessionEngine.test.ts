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

  it('rejects unsupported later-wave question types rather than silently mis-scoring them', () => {
    const numeric: KaniQuestion = {
      ...base,
      id: 'numeric',
      type: 'numeric',
      prompt: 'What is 3 + 4?',
      answer: 7,
      tolerance: 0,
      difficulty: 'easy',
    };
    const engine = new QuestionSessionEngine({ questions: [numeric], config: { randomize: false } });
    expect(() => engine.submitAnswer(7)).toThrow(/not supported/);
  });

  it('requires stable student identity before producing attempts', () => {
    const engine = new QuestionSessionEngine({ questions: [questions[0]], config: { randomize: false } });
    engine.submitAnswer(1);
    expect(() => engine.buildResult({ studentId: '', activityId: 'activity', activityType: 'quiz' })).toThrow(/studentId/);
  });
});
