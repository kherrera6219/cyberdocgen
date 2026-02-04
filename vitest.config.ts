import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";

const dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

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
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "dist/",
        "client/src/components/ui/**",
        "**/*.stories.tsx",
        "**/*.d.ts",
        ".storybook/**",
      ],
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
        name: "unit",
        environment: "node",
        include: [
          "tests/unit/**/*.test.ts",
          "tests/integration/**/*.test.ts",
          "tests/ai/**/*.test.ts",
        ],
        setupFiles: ["./tests/setup.ts"],
        globals: true,
        deps: {
          inline: [/html-encoding-sniffer/, /@exodus\/bytes/],
        }
      },
      {
        plugins: [react()],
        ...sharedConfig,
        name: "components",
        environment: "jsdom",
        include: [
          "tests/components/**/*.test.tsx",
          "tests/accessibility/**/*.test.tsx",
        ],
        setupFiles: ["./tests/setup.ts"],
        globals: true,
      },
    ],
  },
});
