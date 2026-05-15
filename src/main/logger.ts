import { app } from "electron";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import winston from "winston";
import { isDev } from "../shared/build";

let rootLogger: winston.Logger | null = null;

function consoleFormat(): winston.Logform.Format {
  return winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, module, stack }) => {
      const prefix = module ? `[${module}]` : "";
      const stackStr = stack ? `\n${stack}` : "";
      return `${timestamp} ${level} ${prefix} ${message}${stackStr}`;
    }),
  );
}

function fileFormat(): winston.Logform.Format {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );
}

export function initLogger(): winston.Logger {
  if (rootLogger) return rootLogger;

  const logDir = join(app.getPath("userData"), "logs");
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  rootLogger = winston.createLogger({
    level: isDev ? "debug" : "info",
    defaultMeta: { service: "puck" },
    transports: [
      new winston.transports.Console({
        format: isDev ? consoleFormat() : fileFormat(),
      }),
      new winston.transports.File({
        filename: join(logDir, "puck.log"),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 3,
        format: fileFormat(),
      }),
    ],
  });

  return rootLogger;
}

export function getLogger(): winston.Logger {
  if (!rootLogger) {
    throw new Error("Logger not initialized. Call initLogger() first.");
  }
  return rootLogger;
}

export function createLogger(module: string): winston.Logger {
  return getLogger().child({ module });
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    getLogger().debug(message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    getLogger().info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    getLogger().warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    getLogger().error(message, meta),
};
