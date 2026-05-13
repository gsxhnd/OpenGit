/**
 * Preload脚本 - 使用contextBridge暴露IPC API到渲染进程
 * 提供类型安全的主进程通信接口
 *
 * Preload Script - Exposes IPC API to renderer using contextBridge
 * Provides type-safe communication interface to main process
 */
import { contextBridge } from "electron";
import { api } from "./api";

// ============================================================================
// 暴露API到渲染进程 | Expose API to renderer
// ============================================================================

/**
 * 通过contextBridge暴露API到渲染进程的全局作用域
 * 在渲染进程中可通过 window.api 访问
 *
 * Expose API to renderer's global scope via contextBridge
 * Accessible via window.api in renderer process
 */
contextBridge.exposeInMainWorld("api", api);

/**
 * TypeScript类型导出
 * 用于渲染进程的类型检查
 *
 * TypeScript type export
 * Used for type checking in renderer process
 */
export type ElectronAPI = typeof api;
