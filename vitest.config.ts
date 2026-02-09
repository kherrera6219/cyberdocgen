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
      "@assets": path.resolve(dirname, "./attached_assets"),
    },
  },
};

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  ...sharedConfig,
  test: {
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    environment: "node",
    environmentMatchGlobs: [
      ["tests/components/**", "jsdom"],
      ["tests/accessibility/**", "jsdom"],
    ],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/integration/**/*.test.ts",
      "tests/ai/**/*.test.ts",
      "tests/components/**/*.test.tsx",
      "tests/accessibility/**/*.test.tsx",
    ],
    server: {
      deps: {
        inline: [/html-encoding-sniffer/, /@exodus\/bytes/],
      },
    },
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "client/src/**/*.{ts,tsx}",
        "server/**/*.{ts,tsx}",
        "shared/**/*.{ts,tsx}",
      ],
      exclude: [
        "node_modules/",
        "tests/",
        "dist/",
        "scripts/**",
        "electron/**",
        "client/public/**",
        "public/**",
        "client/src/components/ui/**",
        "client/src/lib/serviceWorker.ts",
        "client/src/utils/accessibility.ts",
        "server/config/runtime.test.ts",
        "**/*.stories.tsx",
        "**/*.d.ts",
        ".storybook/**",
      ],
      thresholds: {
        // Staged non-regression gate. Long-term target remains 80/75+ in docs.
        lines: 78.5,
        functions: 67,
        branches: 74.5,
        statements: 78.5,
      },
    },
  },
});
