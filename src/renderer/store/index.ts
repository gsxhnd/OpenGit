/**
 * Zustand store — settings, navigation, remote session meta, toasts.
 */
import { create } from 'zustand'
import type { AppSettings, RemoteSessionMeta, Toast, ToastKind, ViewType } from '@shared/types'
import type { Language } from '../i18n/translations'

interface AppState {
  settings: AppSettings | null
  currentView: ViewType
  previousView: ViewType | null
  language: Language

  /** All active remote sessions (Phase 2 multi-session) */
  sessions: RemoteSessionMeta[]
  /** Currently selected remote session ID */
  activeSessionId: string | null

  toasts: Toast[]

  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  setLanguage: (language: Language) => Promise<void>
  setView: (view: ViewType) => void
  goBack: () => void

  addSession: (meta: RemoteSessionMeta) => void
  removeSession: (connectionId: string) => void
  setActiveSessionId: (connectionId: string | null) => void

  addToast: (message: string, kind: ToastKind) => void
  removeToast: (id: string) => void
}

let toastCounter = 0

export const useAppStore = create<AppState>((set, get) => ({
  settings: null,
  currentView: 'welcome',
  previousView: null,
  language: 'en',
  sessions: [],
  activeSessionId: null,
  toasts: [],

  loadSettings: async () => {
    const settings = await window.api.getSettings()
    set({
      settings,
      language: (settings.language as Language) || 'en',
    })
  },

  updateSettings: async (partial) => {
    const updated = await window.api.setSettings(partial)
    set({ settings: updated })
  },

  setLanguage: async (language) => {
    const s = get().settings
    if (s) {
      await get().updateSettings({ ...s, language })
      set({ language })
    }
  },

  setView: (view) => {
    const current = get().currentView
    set({ currentView: view, previousView: current })
  },

  goBack: () => {
    const prev = get().previousView
    if (prev) {
      set({ currentView: prev, previousView: null })
    }
  },

  addSession: (meta) => {
    set((state) => {
      const existing = state.sessions.find((s) => s.connectionId === meta.connectionId)
      if (existing) return { activeSessionId: meta.connectionId }
      return {
        sessions: [...state.sessions, meta],
        activeSessionId: meta.connectionId,
      }
    })
  },

  removeSession: (connectionId) => {
    set((state) => {
      const sessions = state.sessions.filter((s) => s.connectionId !== connectionId)
      const activeSessionId =
        state.activeSessionId === connectionId
          ? sessions.length > 0
            ? sessions[0].connectionId
            : null
          : state.activeSessionId
      return { sessions, activeSessionId }
    })
  },

  setActiveSessionId: (connectionId) => set({ activeSessionId: connectionId }),

  addToast: (message, kind) => {
    const id = `toast-${++toastCounter}`
    const toast: Toast = { id, message, kind, createdAt: Date.now() }
    set((state) => ({
      toasts: [...state.toasts.slice(-4), toast],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 5000)
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
