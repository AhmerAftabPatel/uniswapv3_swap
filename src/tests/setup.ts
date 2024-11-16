import '@testing-library/jest-dom';

// Mock ResizeObserver which might be needed for some UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));