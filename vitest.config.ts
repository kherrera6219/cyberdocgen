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
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "dist/", "client/", "**/*.d.ts"],
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
      //   extends: true,
      //   plugins: [
      //     storybookTest({
      //       configDir: path.join(dirname, ".storybook"),
      //     }),
      //   ],
      //   test: {
      //     name: "storybook",
      //     // browser: {
      //     //   enabled: true,
      //     //   headless: true,
      //     //   provider: playwright({}),
      //     //   instances: [
      //     //     {
      //     //       browser: "chromium",
      //     //     },
      //     //   ],
      //     // },
      //     setupFiles: [".storybook/vitest.setup.ts"],
      //   },
      // },
    ],
  },
});
