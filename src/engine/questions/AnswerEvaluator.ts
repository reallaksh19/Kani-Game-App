import { KaniQuestion } from '../../integration/kani/contracts';
import { AnswerEvaluation, SupportedAnswer } from './types';

function normalizeText(value: unknown, caseSensitive: boolean): string {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  return caseSensitive ? text : text.toLocaleLowerCase();
}

function arraysEqualAsSets(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...new Set(left)].sort((x, y) => x - y);
  const b = [...new Set(right)].sort((x, y) => x - y);
  return a.length === b.length && a.every((value, index) => value === b[index]);
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
    default:
      return {
        supported: false,
        correct: false,
        partialCredit: 0,
        normalizedAnswer: answer,
      };
  }
}
