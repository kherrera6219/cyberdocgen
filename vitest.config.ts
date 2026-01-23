import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
// import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import path from "path";
import { defineConfig } from "vitest/config";
const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const sharedConfig = {
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./client/src"),
      "@shared": path.resolve(dirname, "./shared"),
      "@server": path.resolve(dirname, "./server"),
    },
  },
};
export default defineConfig({
  plugins: [react()],
  ...sharedConfig,
  test: {
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Global timeout settings to prevent hanging tests
    testTimeout: 30000, // 30 seconds per individual test
    hookTimeout: 10000, // 10 seconds for beforeEach/afterEach hooks
    teardownTimeout: 10000, // 10 seconds for cleanup
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "dist/",
        "client/src/components/ui/**", // Exclude shadcn UI primitives (third-party)
        "**/*.stories.tsx", // Exclude story files
        "**/*.d.ts",
        ".storybook/**",
      ],
      // Enforce 80% minimum coverage for enterprise standards
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    projects: [
      {
        ...sharedConfig,
        test: {
          name: "unit",
          environment: "node",
          include: [
            "tests/unit/**/*.test.ts",
            "tests/integration/**/*.test.ts",
            "tests/ai/**/*.test.ts",
          ],
          setupFiles: ["./tests/setup.ts"],
          globals: true,
        },
      },
      {
        plugins: [react()],
        ...sharedConfig,
        test: {
          name: "components",
          environment: "jsdom",
          include: [
            "tests/components/**/*.test.tsx",
            "tests/accessibility/**/*.test.tsx"
          ],
          setupFiles: ["./tests/setup.ts"],
          globals: true,
        },
      },
      // {
      //   plugins: [
      //     storybookTest({
      //       configDir: path.join(dirname, ".storybook"),
      //     }),
      //   ],
      //   test: {
      //     name: "storybook",
      //     environment: "jsdom",
      //     include: ["**/*.stories.?(t|j)sx?"],
      //     setupFiles: [".storybook/vitest.setup.ts"],
      //     globals: true,
      //   },
      // },
    ],
  },
});
