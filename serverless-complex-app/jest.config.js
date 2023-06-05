module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['./src/test/setup-before-env.ts'],
  setupFilesAfterEnv: ['./src/test/setup-after-env.ts']
};
