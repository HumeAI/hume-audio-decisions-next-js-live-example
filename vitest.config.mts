import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { mockReset: true, unstubEnvs: true, unstubGlobals: true },
});
