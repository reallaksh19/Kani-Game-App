import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SvgDiagramRenderer } from './SvgDiagramRenderer';

describe('SvgDiagramRenderer', () => {
    it('renders numbered shapes accurately with shape values', () => {
        render(
            <SvgDiagramRenderer
                url="svg:shapes-numbered:square=4,pentagon=0,triangle=5,hexagon=6,circle=3"
            />
        );

        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByTitle('Zoom Diagram')).toBeInTheDocument();
    });

    it('renders compass diagrams with the requested eight-point heading', () => {
        render(<SvgDiagramRenderer url="svg:compass:heading=North-West" />);

        expect(screen.getByLabelText('Compass heading North-West')).toBeInTheDocument();
        expect(screen.getByText('Facing North-West')).toBeInTheDocument();
        expect(screen.getByText('NW')).toBeInTheDocument();
    });

    it('renders visual sequence protocol and marks the missing position', () => {
        render(<SvgDiagramRenderer url="svg:sequence:A1|C2|E3|G4|?" />);

        expect(screen.getByLabelText('Visual sequence')).toBeInTheDocument();
        expect(screen.getByText('A1')).toBeInTheDocument();
        expect(screen.getByText('G4')).toBeInTheDocument();
        expect(screen.getByLabelText('Missing item at position 5')).toHaveTextContent('?');
    });

    it('renders visual grid protocol and identifies a missing cell', () => {
        render(<SvgDiagramRenderer url="svg:grid:★|○|★;○|★|○;★|○|?" />);

        expect(screen.getByLabelText('3 by 3 visual grid')).toBeInTheDocument();
        expect(screen.getByLabelText('Missing cell row 3 column 3')).toHaveTextContent('?');
    });

    it('opens and closes the zoomed diagram view', () => {
        render(<SvgDiagramRenderer url="svg:sequence:▲|▲|○|?" />);

        fireEvent.click(screen.getByTitle('Zoom Diagram'));
        expect(screen.getByRole('dialog', { name: 'Detailed diagram view' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Close zoomed diagram' }));
        expect(screen.queryByRole('dialog', { name: 'Detailed diagram view' })).not.toBeInTheDocument();
    });

    it('renders the hidden triangle protocol', () => {
        render(<SvgDiagramRenderer url="svg:hidden-triangle" />);
        expect(screen.getByLabelText('Rectangle containing a hidden right triangle')).toBeInTheDocument();
    });

    it('returns null when url is empty', () => {
        const { container } = render(<SvgDiagramRenderer url="" />);
        expect(container.firstChild).toBeNull();
    });
});
