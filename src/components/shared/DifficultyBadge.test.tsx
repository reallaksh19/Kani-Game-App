import { render, screen } from '@testing-library/react';
import { DifficultyBadge } from './DifficultyBadge';
import { describe, it, expect } from 'vitest';

describe('DifficultyBadge', () => {
    it('renders Easy with green background', () => {
        render(<DifficultyBadge difficulty="Easy" />);
        const badge = screen.getByText('Easy');
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('bg-green-500');
    });

    it('renders Medium with yellow background', () => {
        render(<DifficultyBadge difficulty="Medium" />);
        const badge = screen.getByText('Medium');
        expect(badge.className).toContain('bg-yellow-500');
    });

    it('renders Hard with red background', () => {
        render(<DifficultyBadge difficulty="Hard" />);
        const badge = screen.getByText('Hard');
        expect(badge.className).toContain('bg-red-500');
    });
});
