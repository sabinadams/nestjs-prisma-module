import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watchExclude: ['./test/helpers/prisma/**/*'],
  },
});
