/**
 * Jest Setup
 * AfterHoursID - Production Reliability
 */

/// <reference types="jest" />

// Global test setup
beforeAll(() => {
  // Set test environment variables
  // Note: In test environment, NODE_ENV is typically set by Jest automatically
  // Using type assertion to allow assignment to process.env for testing purposes
  const testEnv = process.env as Record<string, string>;
  testEnv.NODE_ENV = 'test';
  testEnv.JWT_SECRET = 'test-secret-key';
  testEnv.DATABASE_URL = 'postgresql://test:test@localhost:5432/afterhours_test';
});

// Mock Next.js cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

// Mock database
jest.mock('@/lib/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
