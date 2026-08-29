import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@upstash/redis$': '<rootDir>/tests/__mocks__/upstash-redis.ts',
    '^uuid$': '<rootDir>/tests/__mocks__/empty.js',
    '^jayson(.*)$': '<rootDir>/tests/__mocks__/empty.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@upstash|uncrypto|uuid|jayson)/)',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
