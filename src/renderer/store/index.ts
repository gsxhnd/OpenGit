/**
 * 应用全局状态 - Zustand存储
 * 管理配置、导航视图、远程会话、Toast通知
 *
 * App Global State - Zustand Store
 * Manages configuration, navigation views, remote sessions, toast notifications
 */
import { create } from "zustand";
import type {
  AppSettings,
  RemoteSessionMeta,
  Toast,
  ToastKind,
  ViewType,
} from "@shared/types";
import type { Language } from "../i18n/translations";

// ============================================================================
// 应用状态类型 | App state type
// ============================================================================

interface AppState {
  // ========================================================================
  // 配置状态 | Configuration state
  // ========================================================================

  /**
   * 当前应用配置
   * Current application settings
   */
  settings: AppSettings | null;

  /**
   * 当前显示的视图
   * Current displayed view
   */
  currentView: ViewType;

  /**
   * 上一个视图（用于返回导航）
   * Previous view (for back navigation)
   */
  previousView: ViewType | null;

  /**
   * 当前应用语言
   * Current app language
   */
  language: Language;

  // ========================================================================
  // 远程会话状态 | Remote session state
  // ========================================================================

  /**
   * 所有活跃的远程会话
   * 支持多会话连接（Phase 2阶段）
   *
   * All active remote sessions
   * Supports multi-session connections (Phase 2)
   */
  sessions: RemoteSessionMeta[];

  /**
   * 当前选中的远程会话ID
   * Currently selected remote session ID
   */
  activeSessionId: string | null;

  // ========================================================================
  // 通知状态 | Notification state
  // ========================================================================

  /**
   * 所有待显示的Toast通知
   * All pending toast notifications
   */
  toasts: Toast[];

  // ========================================================================
  // Workbench UI (Inspector)
  // ========================================================================

  /** Right-hand Inspector panel (properties / tasks) — Phase 0 placeholder */
  inspectorOpen: boolean;

  // ========================================================================
  // 配置操作 | Configuration actions
  // ========================================================================

  /**
   * 从主进程加载应用配置
   * Load app config from main process
   */
  loadSettings: () => Promise<void>;

  /**
   * 更新部分应用配置
   * Update partial app settings
   */
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;

  /**
   * 设置应用语言
   * Set app language
   */
  setLanguage: (language: Language) => Promise<void>;

  // ========================================================================
  // 导航操作 | Navigation actions
  // ========================================================================

  /**
   * 切换到指定视图
   * Switch to specified view
   */
  setView: (view: ViewType) => void;

  /**
   * 返回上一个视图
   * Go back to previous view
   */
  goBack: () => void;

  // ========================================================================
  // 远程会话操作 | Remote session actions
  // ========================================================================

  /**
   * 添加新的远程会话
   * 如果会话已存在则激活，否则创建新会话
   *
   * Add new remote session
   * Activates if exists, otherwise creates new session
   */
  addSession: (meta: RemoteSessionMeta) => void;

  /**
   * 移除指定的远程会话
   * 如果移除的是活跃会话，则自动切换到其他会话
   *
   * Remove specified remote session
   * Auto-switches to another session if removing active one
   */
  removeSession: (connectionId: string) => void;

  /**
   * 设置活跃的远程会话ID
   * Set active remote session ID
   */
  setActiveSessionId: (connectionId: string | null) => void;

  // ========================================================================
  // Toast通知操作 | Toast notification actions
  // ========================================================================

  /**
   * 添加新的Toast通知
   * 自动在5秒后消失，最多保留5条通知
   *
   * Add new toast notification
   * Auto-dismisses after 5s, keeps max 5 notifications
   */
  addToast: (message: string, kind: ToastKind) => void;

  /**
   * 移除指定的Toast通知
   * Remove specified toast notification
   */
  removeToast: (id: string) => void;

  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
}

// ============================================================================
// Toast计数器 | Toast counter
// ============================================================================

/**
 * 用于生成唯一的Toast ID
 * Used to generate unique toast IDs
 */
let toastCounter = 0;

// ============================================================================
// Zustand Store创建 | Zustand store creation
// ============================================================================

/**
 * 创建应用全局状态store
 * Create app global state store
 */
export const useAppStore = create<AppState>((set, get) => ({
  // ========================================================================
  // 初始状态 | Initial state
  // ========================================================================
  settings: null,
  currentView: "dashboard",
  previousView: null,
  language: "en",
  sessions: [],
  activeSessionId: null,
  toasts: [],
  inspectorOpen: false,

  // ========================================================================
  // 配置操作实现 | Configuration actions implementation
  // ========================================================================

  /**
   * 从主进程加载配置
   * Load config from main process
   */
  loadSettings: async () => {
    const settings = await window.api.getSettings();
    set({
      settings,
      language: (settings.language as Language) || "en",
    });
  },

  /**
   * 更新配置到主进程
   * Update config to main process
   */
  updateSettings: async (partial) => {
    const updated = await window.api.setSettings(partial);
    set({ settings: updated });
  },

  /**
   * 改变应用语言
   * Change app language
   */
  setLanguage: async (language) => {
    const s = get().settings;
    if (s) {
      await get().updateSettings({ ...s, language });
      set({ language });
    }
  },

  // ========================================================================
  // 导航操作实现 | Navigation actions implementation
  // ========================================================================

  /**
   * 切换视图并保存前一个视图
   * Switch view and save previous view
   */
  setView: (view) => {
    const current = get().currentView;
    set({ currentView: view, previousView: current });
  },

  /**
   * 返回前一个视图
   * Go back to previous view
   */
  goBack: () => {
    const prev = get().previousView;
    if (prev) {
      set({ currentView: prev, previousView: null });
    }
  },

  // ========================================================================
  // 远程会话操作实现 | Remote session actions implementation
  // ========================================================================

  /**
   * 添加或激活远程会话
   * Add or activate remote session
   */
  addSession: (meta) => {
    set((state) => {
      const existing = state.sessions.find(
        (s) => s.connectionId === meta.connectionId,
      );
      // 如果会话已存在，只激活它 | If session exists, just activate it
      if (existing) return { activeSessionId: meta.connectionId };
      // 否则添加新会话 | Otherwise add new session
      return {
        sessions: [...state.sessions, meta],
        activeSessionId: meta.connectionId,
      };
    });
  },

  /**
   * 移除远程会话
   * 如果移除的是活跃会话，自动切换到第一个剩余会话
   *
   * Remove remote session
   * Auto-switch to first remaining session if removing active one
   */
  removeSession: (connectionId) => {
    set((state) => {
      const sessions = state.sessions.filter(
        (s) => s.connectionId !== connectionId,
      );
      const activeSessionId =
        state.activeSessionId === connectionId
          ? sessions.length > 0
            ? sessions[0].connectionId
            : null
          : state.activeSessionId;
      return { sessions, activeSessionId };
    });
  },

  /**
   * 设置活跃会话
   * Set active session
   */
  setActiveSessionId: (connectionId) => set({ activeSessionId: connectionId }),

  // ========================================================================
  // Toast操作实现 | Toast actions implementation
  // ========================================================================

  /**
   * 添加Toast通知
   * 自动5秒后移除，最多保留最近的5条
   *
   * Add toast notification
   * Auto-removes after 5s, keeps max 5 most recent
   */
  addToast: (message, kind) => {
    const id = `toast-${++toastCounter}`;
    const toast: Toast = { id, message, kind, createdAt: Date.now() };
    set((state) => ({
      // 只保留最后5条通知 | Keep only last 5 notifications
      toasts: [...state.toasts.slice(-4), toast],
    }));
    // 5秒后自动移除 | Auto-remove after 5s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },

  /**
   * 移除指定的Toast
   * Remove specified toast
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setInspectorOpen: (open) => set({ inspectorOpen: open }),

  toggleInspector: () => set((state) => ({ inspectorOpen: !state.inspectorOpen })),
}));
