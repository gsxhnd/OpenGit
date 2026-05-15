import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "module";
import { prodBuild } from "./vite/prod-build";

export default defineConfig(({ mode }) => {
  const dev = mode === "development";
  return {
    define: {
      __DEV__: JSON.stringify(dev),
      __RENDERER_URL__: JSON.stringify(dev ? "http://localhost:5173" : ""),
    },
    build: {
      outDir: "dist/main",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts"),
        },
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
        external: [
          "electron",
          "ssh2",
          "node-pty",
          "cpu-features",
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
