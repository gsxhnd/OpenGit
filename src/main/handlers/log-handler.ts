import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";
import { LOG_LEVELS, type LogLevel, type RendererLogEntry } from "../../shared/log";
import { createLogger } from "../logger";

const MAX_MESSAGE_LENGTH = 4096;

function sanitizeLevel(level: string): LogLevel {
  if ((LOG_LEVELS as readonly string[]).includes(level)) {
    return level as LogLevel;
  }
  return "info";
}

function truncateMessage(message: string): string {
  if (message.length <= MAX_MESSAGE_LENGTH) return message;
  return `${message.slice(0, MAX_MESSAGE_LENGTH)}…`;
}

function sanitizeMeta(
  meta?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  try {
    JSON.stringify(meta);
    return meta;
  } catch {
    return undefined;
  }
}

export function registerLogHandlers(): void {
  ipcMain.on(IPC_CHANNELS.LOG_WRITE, (_event, entry: RendererLogEntry) => {
    if (!entry || typeof entry.message !== "string") return;

    const level = sanitizeLevel(entry.level);
    const module = entry.module
      ? `renderer:${entry.module}`
      : "renderer";
    const log = createLogger(module);
    const message = truncateMessage(entry.message);
    const meta = sanitizeMeta(entry.meta);
    const logMeta: Record<string, unknown> = { ...meta };
    if (entry.stack) {
      logMeta.stack = entry.stack;
    }

    log.log(level, message, logMeta);
  });
}
