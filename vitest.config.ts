import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/lib/**/*.ts",
        "src/hooks/**/*.ts",
        "src/components/ThemeController.tsx",
        "src/components/ReadmeCardUrlSection.tsx",
        "src/components/BusinessCard.tsx",
        "src/components/LanguageChart.tsx",
        "src/components/SkillsCard.tsx",
        "src/components/LayoutEditor.tsx",
        "src/app/page.tsx",
        "src/lib/rateLimit.ts",
        "src/app/api/og/[username]/route.tsx"
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      exclude: ["**/node_modules/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.join(
        path.dirname(require.resolve("server-only")),
        "empty.js",
      ),
    },
  },
});
