import { vi } from 'vitest';

// Mock next/headers so auth tests don't need the Next.js runtime
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));
