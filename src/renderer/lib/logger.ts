import type { LogLevel } from "@shared/log";

type LogMeta = Record<string, unknown>;

function write(
  level: LogLevel,
  module: string,
  message: unknown,
  meta?: LogMeta,
  stack?: string,
): void {
  const text = message instanceof Error ? message.message : String(message);
  const errorStack =
    stack ?? (message instanceof Error ? message.stack : undefined);

  if (import.meta.env.DEV) {
    const args: unknown[] = [`[${module}]`, text];
    if (meta) args.push(meta);
    switch (level) {
      case "debug":
        console.debug(...args);
        break;
      case "info":
        console.info(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "error":
        console.error(...args);
        break;
    }
  }

  window.api.logWrite({
    level,
    message: text,
    module,
    meta,
    stack: errorStack,
  });
}

export interface RendererLogger {
  debug(message: unknown, meta?: LogMeta): void;
  info(message: unknown, meta?: LogMeta): void;
  warn(message: unknown, meta?: LogMeta): void;
  error(message: unknown, meta?: LogMeta): void;
}

export function createRendererLogger(module: string): RendererLogger {
  return {
    debug: (message, meta) => write("debug", module, message, meta),
    info: (message, meta) => write("info", module, message, meta),
    warn: (message, meta) => write("warn", module, message, meta),
    error: (message, meta) => write("error", module, message, meta),
  };
}
