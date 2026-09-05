import { KaniQuestion } from '../../integration/kani/contracts';
import { QuestionResponseEvidence, QuestionReviewEvidence } from './types';

function questionPrompt(question: KaniQuestion): string {
  if ('prompt' in question && typeof question.prompt === 'string') return question.prompt;
  if (question.type === 'assertion_reason') return `${question.assertion} — ${question.reason}`;
  return question.type;
}

function correctAnswerFor(question: KaniQuestion): unknown {
  switch (question.type) {
    case 'mcq': return question.answerIndex;
    case 'multi_select': return question.answerIndexes;
    case 'true_false': return question.answer;
    case 'short_answer': return question.acceptedAnswers;
    case 'numeric': return { answer: question.answer, tolerance: question.tolerance, unit: question.unit };
    case 'fill_in_blank': return question.acceptedAnswers;
    case 'match_following': return question.correctPairs;
    case 'assertion_reason': return question.answerIndex;
    case 'sequence_order': return question.correctOrder;
    case 'long_answer': return question.modelAnswer;
    case 'diagram_label': return question.answerMap;
    case 'interactive_external': return undefined;
  }
}

export function buildQuestionReviewEvidence(
  questions: readonly KaniQuestion[],
  responses: readonly QuestionResponseEvidence[],
): QuestionReviewEvidence[] {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  return responses.flatMap((response) => {
    const question = questionById.get(response.questionId);
    if (!question) return [];
    return [{
      questionId: response.questionId,
      type: question.type,
      prompt: questionPrompt(question),
      selectedAnswer: response.answer,
      correctAnswer: correctAnswerFor(question),
      correct: response.correct,
      partialCredit: response.partialCredit,
      responseTimeMs: response.responseTimeMs,
      hintsUsed: response.hintsUsed,
      explanation: question.explanation,
      hint: question.hint,
    }];
  });
}
