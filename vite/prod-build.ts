export function prodBuild(dev: boolean) {
  return {
    esbuild: dev ? {} : { legalComments: "none" as const },
    minify: dev ? false : ("terser" as const),
    sourcemap: dev,
    terserOptions: dev
      ? undefined
      : {
          format: { comments: false },
          compress: { pure_funcs: ["console.log"], drop_debugger: true },
        },
  };
}
