import { render, screen } from '@testing-library/react';
import { SvgDiagramRenderer } from './SvgDiagramRenderer';
import { describe, it, expect } from 'vitest';

describe('SvgDiagramRenderer', () => {
    it('renders numbered shapes accurately with shape values', () => {
        render(
            <SvgDiagramRenderer
                url="svg:shapes-numbered:square=4,pentagon=0,triangle=5,hexagon=6,circle=3"
            />
        );

        // Check all numbers are present inside SVG texts
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Check zoom button is rendered
        expect(screen.getByTitle('Zoom Diagram')).toBeInTheDocument();
    });

    it('renders compass diagram protocol', () => {
        render(<SvgDiagramRenderer url="svg:compass:heading=North" />);
        expect(screen.getByText('Compass Direction')).toBeInTheDocument();
        expect(screen.getByText('N')).toBeInTheDocument();
    });

    it('returns null when url is empty', () => {
        const { container } = render(<SvgDiagramRenderer url="" />);
        expect(container.firstChild).toBeNull();
    });
});
