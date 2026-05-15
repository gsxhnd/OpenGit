import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "module";
import { prodBuild } from "./vite/prod-build";

export default defineConfig(({ mode }) => {
  const dev = mode === "development";
  return {
    build: {
      outDir: "dist/preload",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts"),
        },
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
        external: [
          "electron",
          ...builtinModules,
          ...builtinModules.map((m) => `node:${m}`),
        ],
      },
      ...prodBuild(dev),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        "@shared": resolve(__dirname, "src/shared"),
      },
    },
  };
});
