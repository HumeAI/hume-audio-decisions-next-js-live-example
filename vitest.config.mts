import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { unstubEnvs: true, unstubGlobals: true },
});
