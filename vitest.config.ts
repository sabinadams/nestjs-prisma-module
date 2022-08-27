/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    watchExclude: ['./test/helpers/prisma/**/*'],
  },
});
