import '@testing-library/jest-dom';
import { vi } from 'vitest';
import dotenv from 'dotenv';

// Load .env.local for tests (works locally, but will be missing in CI)
dotenv.config({ path: '.env.local' });

// Mock environment variables for tests (fallback for CI)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mock.supabase.co');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'mock-anon-key');
}

// Mock matchMedia for jsdom
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
