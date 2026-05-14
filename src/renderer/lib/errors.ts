/**
 * 错误处理工具 - 统一错误消息和恢复建议
 * Error handling utilities - Unified error messages and recovery suggestions
 */

export type ErrorSeverity = "info" | "warning" | "error";

export interface ErrorContext {
  operation: string;
  resource?: string;
  details?: string;
}

/**
 * 解析错误并返回用户友好的消息
 * Parse error and return user-friendly message
 */
export function parseError(
  err: unknown,
  context: ErrorContext,
): { message: string; severity: ErrorSeverity } {
  const errorMsg = err instanceof Error ? err.message : String(err);

  // SFTP specific errors
  if (errorMsg.includes("ENOENT") || errorMsg.includes("No such file")) {
    return {
      message: `File not found: ${context.resource || "unknown"}`,
      severity: "warning",
    };
  }

  if (errorMsg.includes("EACCES") || errorMsg.includes("Permission denied")) {
    return {
      message: `Permission denied when accessing: ${context.resource || "unknown"}`,
      severity: "error",
    };
  }

  if (errorMsg.includes("EISDIR") || errorMsg.includes("Is a directory")) {
    return {
      message: `Cannot perform operation on directory: ${context.resource || "unknown"}`,
      severity: "warning",
    };
  }

  if (errorMsg.includes("EEXIST") || errorMsg.includes("File exists")) {
    return {
      message: `File already exists: ${context.resource || "unknown"}`,
      severity: "warning",
    };
  }

  if (errorMsg.includes("timeout") || errorMsg.includes("ETIMEDOUT")) {
    return {
      message: `Operation timed out. Connection may be unstable.`,
      severity: "error",
    };
  }

  if (errorMsg.includes("disconnect") || errorMsg.includes("closed")) {
    return {
      message: `Connection lost during ${context.operation}`,
      severity: "error",
    };
  }

  if (errorMsg.includes("authentication") || errorMsg.includes("auth")) {
    return {
      message: `Authentication failed. Please check your credentials.`,
      severity: "error",
    };
  }

  // Network errors
  if (errorMsg.includes("ECONNREFUSED")) {
    return {
      message: `Connection refused. Server may be offline or port is blocked.`,
      severity: "error",
    };
  }

  if (errorMsg.includes("ECONNRESET")) {
    return {
      message: `Connection reset by peer`,
      severity: "error",
    };
  }

  // Default error
  return {
    message: errorMsg || `Failed to ${context.operation}`,
    severity: "error",
  };
}

/**
 * 验证文件路径
 * Validate file path
 */
export function validatePath(path: string): { valid: boolean; error?: string } {
  if (!path || typeof path !== "string") {
    return { valid: false, error: "Path is required" };
  }

  if (path.trim().length === 0) {
    return { valid: false, error: "Path cannot be empty" };
  }

  // Check for problematic characters (very permissive, only block null bytes)
  if (path.includes("\0")) {
    return { valid: false, error: "Path contains invalid characters" };
  }

  return { valid: true };
}

/**
 * 验证文件名
 * Validate filename
 */
export function validateFilename(filename: string): {
  valid: boolean;
  error?: string;
} {
  if (!filename || typeof filename !== "string") {
    return { valid: false, error: "Filename is required" };
  }

  if (filename.trim().length === 0) {
    return { valid: false, error: "Filename cannot be empty" };
  }

  // Check length
  if (filename.length > 255) {
    return { valid: false, error: "Filename is too long (max 255 characters)" };
  }

  // Check for problematic characters
  if (filename.includes("/") || filename.includes("\0")) {
    return { valid: false, error: "Filename contains invalid characters" };
  }

  // Warn about dots
  if (filename === "." || filename === "..") {
    return { valid: false, error: 'Cannot use "." or ".." as filename' };
  }

  return { valid: true };
}

/**
 * 验证文件大小（读取时）
 * Validate file size for reading
 */
export function validateFileSizeForReading(
  bytes: number,
  maxMB = 10,
): { valid: boolean; warning?: string } {
  const maxBytes = maxMB * 1024 * 1024;

  if (bytes > maxBytes) {
    return {
      valid: false,
      warning: `File is ${(bytes / (1024 * 1024)).toFixed(1)}MB, exceeds recommended limit of ${maxMB}MB`,
    };
  }

  if (bytes > 5 * 1024 * 1024) {
    return {
      valid: true,
      warning: `File is large (${(bytes / (1024 * 1024)).toFixed(1)}MB), may be slow to load`,
    };
  }

  return { valid: true };
}

/**
 * 格式化错误显示
 * Format error for display
 */
export function formatErrorMessage(
  err: unknown,
  fallback = "An error occurred",
): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  return fallback;
}
