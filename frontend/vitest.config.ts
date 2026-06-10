import path from "node:path";
import { defineConfig } from "vitest/config";

// No @vitejs/plugin-react needed: esbuild compiles TSX using the tsconfig
// `jsx: "react-jsx"` setting, and tests don't use HMR/fast-refresh.
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` throws outside React Server environments; stub it so
      // server modules (lib/db/*) can be unit-tested.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
});
