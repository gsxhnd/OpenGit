export type LogLevel = "error" | "warn" | "info" | "debug";

export const LOG_LEVELS: readonly LogLevel[] = [
  "error",
  "warn",
  "info",
  "debug",
] as const;

export interface RendererLogEntry {
  level: LogLevel;
  message: string;
  module?: string;
  meta?: Record<string, unknown>;
  stack?: string;
}
