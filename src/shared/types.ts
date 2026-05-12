/**
 * Shared Types - 跨进程共享类型定义
 */

export interface WindowConfig {
  width: number
  height: number
  x?: number
  y?: number
}

export interface AppSettings {
  window: WindowConfig
  theme: string
  language: string
}

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  kind: ToastKind
  createdAt: number
}

export type ViewType = 'welcome' | 'settings'
