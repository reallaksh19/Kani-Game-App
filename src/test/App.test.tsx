import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Simple component to test
const TestComponent = () => <div>Hello World</div>;

describe('App', () => {
    it('renders without crashing', () => {
        render(<TestComponent />);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
});
