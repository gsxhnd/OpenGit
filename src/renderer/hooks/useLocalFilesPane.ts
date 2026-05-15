import { useCallback, useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import type { LocalFileEntry } from "@shared/types";

export interface FilesState {
  localCwd: string;
  localEntries: LocalFileEntry[];
  localLoading: boolean;
  localError: string | null;
}

const initialState: FilesState = {
  localCwd: "/",
  localEntries: [],
  localLoading: false,
  localError: null,
};

export function useLocalFilesPane() {
  const { t } = useTranslation();
  const { addToast } = useAppStore(useShallow((s) => ({ addToast: s.addToast })));
  const [state, setState] = useReducer(
    (s: FilesState, a: Partial<FilesState>) => ({ ...s, ...a }),
    initialState,
  );

  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const loadLocalDirectory = useCallback(
    async (dir: string) => {
      setState({ localLoading: true, localError: null });
      try {
        const entries = await window.api.localReaddir(dir);
        const sorted = entries.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return b.isDirectory ? 1 : -1;
          return a.name.localeCompare(b.name);
        });
        setState({ localEntries: sorted, localCwd: dir, localLoading: false });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : t("workbench.loadFailed");
        addToast(msg, "error");
        setState({ localLoading: false, localError: msg });
      }
    },
    [addToast, t],
  );

  const handleNavigateLocal = useCallback(
    (path: string) => {
      void loadLocalDirectory(path);
    },
    [loadLocalDirectory],
  );

  const handleUpLocal = useCallback(() => {
    const parts = state.localCwd.split(/[\\/]/).filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      const parent = parts.length === 0 ? "/" : "/" + parts.join("/");
      void loadLocalDirectory(parent);
    }
  }, [state.localCwd, loadLocalDirectory]);

  const handleNewFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    try {
      const path =
        state.localCwd +
        (state.localCwd.endsWith("/") ? "" : "/") +
        newFolderName;
      await window.api.localMkdir(path);
      setNewFolderName("");
      setShowNewFolderInput(false);
      await loadLocalDirectory(state.localCwd);
      addToast(t("workbench.folderCreated"), "success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("workbench.operationFailed");
      addToast(msg, "error");
    }
  }, [newFolderName, state.localCwd, addToast, t, loadLocalDirectory]);

  const handleDeleteLocal = useCallback(
    async (entry: LocalFileEntry) => {
      if (!confirm(`${t("workbench.confirmDelete")} "${entry.name}"?`)) return;
      try {
        if (entry.isDirectory) {
          await window.api.localRmdir(entry.path);
        } else {
          await window.api.localUnlink(entry.path);
        }
        await loadLocalDirectory(state.localCwd);
        addToast(t("workbench.deleteSuccess"), "success");
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : t("workbench.operationFailed");
        addToast(msg, "error");
      }
    },
    [state.localCwd, addToast, t, loadLocalDirectory],
  );

  useEffect(() => {
    void loadLocalDirectory(state.localCwd);
  }, []);

  return {
    state,
    newFolderName,
    setNewFolderName,
    showNewFolderInput,
    setShowNewFolderInput,
    loadLocalDirectory,
    handleNavigateLocal,
    handleUpLocal,
    handleNewFolder,
    handleDeleteLocal,
  };
}
