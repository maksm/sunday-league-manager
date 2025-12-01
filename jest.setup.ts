import '@testing-library/jest-dom';

// Polyfill for Next.js server-side APIs
import { TextEncoder, TextDecoder } from 'util';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.TextEncoder = TextEncoder as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.TextDecoder = TextDecoder as any;

// Mock NextAuth
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: { GET: jest.fn(), POST: jest.fn() },
  })),
  getServerSession: jest.fn(),
}));
