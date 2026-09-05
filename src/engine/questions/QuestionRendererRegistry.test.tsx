import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KaniQuestion } from '../../integration/kani/contracts';
import { isQuestionTypeRenderable, renderCanonicalQuestion } from './QuestionRendererRegistry';

const base = {
  schemaVersion: '1.0' as const,
  id: 'q',
  subjectId: 'mathematics',
  topicId: 'topic',
  skillIds: [],
  conceptTags: [],
  curriculumTags: [],
  difficulty: 'medium' as const,
};

describe('second-wave canonical renderers', () => {
  it('submits numeric answers', () => {
    const question: KaniQuestion = { ...base, type: 'numeric', prompt: 'Value?', answer: 7, tolerance: 0, unit: 'cm' };
    const onSubmit = vi.fn();
    render(<>{renderCanonicalQuestion(question, onSubmit)}</>);
    fireEvent.change(screen.getByRole('spinbutton', { name: /numeric answer/i }), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: /submit answer/i }));
    expect(onSubmit).toHaveBeenCalledWith(7);
  });

  it('submits complete matching maps', () => {
    const question: KaniQuestion = {
      ...base,
      type: 'match_following',
      prompt: 'Match.',
      leftItems: [{ id: 'l1', text: 'Half' }, { id: 'l2', text: 'Quarter' }],
      rightItems: [{ id: 'r1', text: '1/2' }, { id: 'r2', text: '1/4' }],
      correctPairs: [['l1', 'r1'], ['l2', 'r2']],
    };
    const onSubmit = vi.fn();
    render(<>{renderCanonicalQuestion(question, onSubmit)}</>);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'r1' } });
    fireEvent.change(selects[1], { target: { value: 'r2' } });
    fireEvent.click(screen.getByRole('button', { name: /submit matches/i }));
    expect(onSubmit).toHaveBeenCalledWith({ l1: 'r1', l2: 'r2' });
  });

  it('renders assertion/reason choices and an intentionally scrambled sequence', () => {
    const assertion: KaniQuestion = {
      ...base,
      type: 'assertion_reason',
      assertion: 'A',
      reason: 'R',
      options: ['Option 1', 'Option 2'],
      answerIndex: 1,
    };
    const assertionSubmit = vi.fn();
    const { unmount } = render(<>{renderCanonicalQuestion(assertion, assertionSubmit)}</>);
    fireEvent.click(screen.getByRole('button', { name: /option 2/i }));
    expect(assertionSubmit).toHaveBeenCalledWith(1);
    unmount();

    const sequence: KaniQuestion = {
      ...base,
      id: 'sequence',
      type: 'sequence_order',
      prompt: 'Order.',
      items: ['First', 'Second', 'Third'],
      correctOrder: [0, 1, 2],
    };
    const sequenceSubmit = vi.fn();
    render(<>{renderCanonicalQuestion(sequence, sequenceSubmit)}</>);
    fireEvent.click(screen.getByRole('button', { name: /submit order/i }));
    expect(sequenceSubmit).toHaveBeenCalledWith([2, 1, 0]);
  });

  it('marks objective wave-two types as renderable while long/diagram remain deferred', () => {
    expect(isQuestionTypeRenderable('numeric')).toBe(true);
    expect(isQuestionTypeRenderable('sequence_order')).toBe(true);
    expect(isQuestionTypeRenderable('match_following')).toBe(true);
    expect(isQuestionTypeRenderable('assertion_reason')).toBe(true);
    expect(isQuestionTypeRenderable('long_answer')).toBe(false);
    expect(isQuestionTypeRenderable('diagram_label')).toBe(false);
  });
});
