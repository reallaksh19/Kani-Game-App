import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock theme config if needed, or other globals
// For now, simple setup is fine as we use shared config files.

// Mock matchMedia if not present (JSDOM doesn't support it fully)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
