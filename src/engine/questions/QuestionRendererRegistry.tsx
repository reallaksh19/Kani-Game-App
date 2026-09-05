import React from 'react';
import { KaniQuestion } from '../../integration/kani/contracts';
import { SupportedAnswer } from './types';
import { AssertionReasonQuestionRenderer } from '../../components/questions/renderers/AssertionReasonQuestionRenderer';
import { MatchFollowingQuestionRenderer } from '../../components/questions/renderers/MatchFollowingQuestionRenderer';
import { McqQuestionRenderer } from '../../components/questions/renderers/McqQuestionRenderer';
import { MultiSelectQuestionRenderer } from '../../components/questions/renderers/MultiSelectQuestionRenderer';
import { NumericQuestionRenderer } from '../../components/questions/renderers/NumericQuestionRenderer';
import { SequenceOrderQuestionRenderer } from '../../components/questions/renderers/SequenceOrderQuestionRenderer';
import { TextQuestionRenderer } from '../../components/questions/renderers/TextQuestionRenderer';
import { TrueFalseQuestionRenderer } from '../../components/questions/renderers/TrueFalseQuestionRenderer';

export function renderCanonicalQuestion(question: KaniQuestion, onSubmit: (answer: SupportedAnswer) => void): React.ReactNode {
  switch (question.type) {
    case 'mcq':
      return <McqQuestionRenderer question={question} onSubmit={onSubmit} />;
    case 'true_false':
      return <TrueFalseQuestionRenderer question={question} onSubmit={onSubmit} />;
    case 'short_answer':
    case 'fill_in_blank':
      return <TextQuestionRenderer key={question.id} question={question} onSubmit={onSubmit} />;
    case 'multi_select':
      return <MultiSelectQuestionRenderer key={question.id} question={question} onSubmit={onSubmit} />;
    case 'numeric':
      return <NumericQuestionRenderer key={question.id} question={question} onSubmit={onSubmit} />;
    case 'sequence_order':
      return <SequenceOrderQuestionRenderer key={question.id} question={question} onSubmit={onSubmit} />;
    case 'match_following':
      return <MatchFollowingQuestionRenderer key={question.id} question={question} onSubmit={onSubmit} />;
    case 'assertion_reason':
      return <AssertionReasonQuestionRenderer key={question.id} question={question} onSubmit={onSubmit} />;
    default:
      return (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-950/40 p-4 text-amber-100" role="status">
          Renderer for <strong>{question.type}</strong> is reserved for a later question-runtime wave.
        </div>
      );
  }
}

export function isQuestionTypeRenderable(type: KaniQuestion['type']): boolean {
  return [
    'mcq',
    'true_false',
    'short_answer',
    'fill_in_blank',
    'multi_select',
    'numeric',
    'sequence_order',
    'match_following',
    'assertion_reason',
  ].includes(type);
}
