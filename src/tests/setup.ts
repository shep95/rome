/**
 * Vitest Setup File
 * Configures the testing environment for security and component tests
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for testing
process.env.VITE_SUPABASE_PROJECT_ID = 'test-project-id';
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {},
  clear: () => {},
  length: 0,
  key: (index: number) => null,
};

global.localStorage = localStorageMock as Storage;

// Mock crypto for Node environment
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {} as any,
  } as any;
}
