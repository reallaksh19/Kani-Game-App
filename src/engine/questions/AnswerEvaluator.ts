import { KaniQuestion } from '../../integration/kani/contracts';
import { AnswerEvaluation, SupportedAnswer } from './types';

function normalizeText(value: unknown, caseSensitive: boolean): string {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  return caseSensitive ? text : text.toLocaleLowerCase();
}

function arraysEqual(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function arraysEqualAsSets(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...new Set(left)].sort((x, y) => x - y);
  const b = [...new Set(right)].sort((x, y) => x - y);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function isStringRecord(value: SupportedAnswer): value is Record<string, string> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function evaluateQuestionAnswer(question: KaniQuestion, answer: SupportedAnswer): AnswerEvaluation {
  switch (question.type) {
    case 'mcq': {
      const selected = Number(answer);
      return {
        supported: true,
        correct: Number.isInteger(selected) && selected === question.answerIndex,
        partialCredit: Number.isInteger(selected) && selected === question.answerIndex ? 1 : 0,
        normalizedAnswer: selected,
        correctAnswer: question.answerIndex,
      };
    }
    case 'true_false': {
      const selected = typeof answer === 'boolean' ? answer : String(answer).toLowerCase() === 'true';
      return {
        supported: true,
        correct: selected === question.answer,
        partialCredit: selected === question.answer ? 1 : 0,
        normalizedAnswer: selected,
        correctAnswer: question.answer,
      };
    }
    case 'short_answer': {
      const selected = normalizeText(answer, question.caseSensitive);
      const accepted = question.acceptedAnswers.map((item) => normalizeText(item, question.caseSensitive));
      const correct = accepted.includes(selected);
      return {
        supported: true,
        correct,
        partialCredit: correct ? 1 : 0,
        normalizedAnswer: String(answer ?? '').trim(),
        correctAnswer: question.acceptedAnswers,
      };
    }
    case 'fill_in_blank': {
      const selected = normalizeText(answer, question.caseSensitive);
      const accepted = question.acceptedAnswers.map((item) => normalizeText(item, question.caseSensitive));
      const correct = accepted.includes(selected);
      return {
        supported: true,
        correct,
        partialCredit: correct ? 1 : 0,
        normalizedAnswer: typeof answer === 'number' ? answer : String(answer ?? '').trim(),
        correctAnswer: question.acceptedAnswers,
      };
    }
    case 'multi_select': {
      const selected = Array.isArray(answer) ? answer.map(Number).filter(Number.isInteger) : [];
      const correct = arraysEqualAsSets(selected, question.answerIndexes);
      const expected = new Set(question.answerIndexes);
      const chosen = new Set(selected);
      const truePositives = [...chosen].filter((index) => expected.has(index)).length;
      const falsePositives = [...chosen].filter((index) => !expected.has(index)).length;
      const denominator = Math.max(1, expected.size);
      const partialCredit = correct ? 1 : Math.max(0, Math.min(1, (truePositives - falsePositives) / denominator));
      return {
        supported: true,
        correct,
        partialCredit,
        normalizedAnswer: selected,
        correctAnswer: question.answerIndexes,
      };
    }
    case 'numeric': {
      const selected = typeof answer === 'number' ? answer : Number(answer);
      const valid = Number.isFinite(selected);
      const difference = valid ? Math.abs(selected - question.answer) : Number.POSITIVE_INFINITY;
      const correct = valid && difference <= question.tolerance;
      return {
        supported: true,
        correct,
        partialCredit: correct ? 1 : 0,
        normalizedAnswer: selected,
        correctAnswer: question.answer,
      };
    }
    case 'sequence_order': {
      const selected = Array.isArray(answer) ? answer.map(Number).filter(Number.isInteger) : [];
      const correct = arraysEqual(selected, question.correctOrder);
      const comparable = Math.min(selected.length, question.correctOrder.length);
      const positionsCorrect = selected.slice(0, comparable).filter((value, index) => value === question.correctOrder[index]).length;
      const partialCredit = correct ? 1 : positionsCorrect / Math.max(1, question.correctOrder.length);
      return {
        supported: true,
        correct,
        partialCredit,
        normalizedAnswer: selected,
        correctAnswer: question.correctOrder,
      };
    }
    case 'match_following': {
      const selected = isStringRecord(answer) ? answer : {};
      const expected = Object.fromEntries(question.correctPairs);
      const expectedEntries = Object.entries(expected);
      const correctPairs = expectedEntries.filter(([leftId, rightId]) => selected[leftId] === rightId).length;
      const extraKeys = Object.keys(selected).filter((leftId) => !(leftId in expected)).length;
      const complete = expectedEntries.length > 0 && Object.keys(selected).length === expectedEntries.length;
      const correct = complete && extraKeys === 0 && correctPairs === expectedEntries.length;
      const partialCredit = correct
        ? 1
        : Math.max(0, Math.min(1, (correctPairs - extraKeys) / Math.max(1, expectedEntries.length)));
      return {
        supported: true,
        correct,
        partialCredit,
        normalizedAnswer: selected,
        correctAnswer: expected,
      };
    }
    case 'assertion_reason': {
      const selected = Number(answer);
      const correct = Number.isInteger(selected) && selected === question.answerIndex;
      return {
        supported: true,
        correct,
        partialCredit: correct ? 1 : 0,
        normalizedAnswer: selected,
        correctAnswer: question.answerIndex,
      };
    }
    default:
      return {
        supported: false,
        correct: false,
        partialCredit: 0,
        normalizedAnswer: answer,
      };
  }
}
