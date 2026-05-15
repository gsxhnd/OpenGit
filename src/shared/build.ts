/** Injected by vite.main.config.ts `define` at build time */
declare const __DEV__: boolean;
declare const __RENDERER_URL__: string;

export const isDev = __DEV__;
export const rendererUrl = __RENDERER_URL__;
