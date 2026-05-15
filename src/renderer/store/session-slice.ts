import type { AppStoreCreator, SessionSlice } from "./types";

export const createSessionSlice: AppStoreCreator<SessionSlice> = (set) => ({
  sessions: [],
  activeSessionId: null,

  addSession: (meta) => {
    set((state) => {
      const existing = state.sessions.find(
        (s) => s.connectionId === meta.connectionId,
      );
      if (existing) {
        return {
          activeSessionId: meta.connectionId,
          sessions: state.sessions.map((s) =>
            s.connectionId === meta.connectionId ? { ...s, ...meta } : s,
          ),
        };
      }
      return {
        sessions: [
          ...state.sessions,
          { ...meta, status: meta.status || "connecting" },
        ],
        activeSessionId: meta.connectionId,
      };
    });
  },

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

  setActiveSessionId: (connectionId) => set({ activeSessionId: connectionId }),

  updateSessionStatus: (connectionId, status) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.connectionId === connectionId ? { ...s, status } : s,
      ),
    })),
});
