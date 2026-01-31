module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@guidr/shared/tokens$': '<rootDir>/../shared/src/tokens/index.ts',
    '^@guidr/shared/styles/react-native$': '<rootDir>/../shared/src/styles/react-native/index.ts',
    '^@guidr/shared/styles/adapters/react-native$': '<rootDir>/../shared/src/styles/adapters/react-native/index.ts',
    '^@guidr/shared/styles/definitions$': '<rootDir>/../shared/src/styles/definitions/index.ts',
    '^@guidr/shared/api/adapters/fetch$': '<rootDir>/../shared/src/api/adapters/fetch/index.ts',
    '^@guidr/shared/api/definitions$': '<rootDir>/__mocks__/@guidr/shared.ts',
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: false,
        tsconfig: {
          jsx: 'react',
          plugins: [
            {
              transform: 'typia/lib/transform',
              type: 'program',
            },
          ],
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation)/)',
  ],
}
