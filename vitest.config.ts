import { defineConfig } from "vitest/config";

// ZOD_V4_SUBPATH=1 runs the suite against zod@3.25, whose v4 API lives at "zod/v4".
const zodV4Subpath = process.env.ZOD_V4_SUBPATH === "1";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: zodV4Subpath ? [{ find: /^zod$/, replacement: "zod/v4" }] : [],
  },
});
