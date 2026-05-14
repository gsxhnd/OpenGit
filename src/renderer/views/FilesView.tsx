import { useCallback, useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
  ArrowUp,
  FolderPlus,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAppStore } from "../store";
import type { LocalFileEntry } from "@shared/types";
import styles from "./FilesView.module.scss";

interface FilesState {
  localCwd: string;
  localEntries: LocalFileEntry[];
  localLoading: boolean;
  localError: string | null;
}

export function FilesView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessions, addToast } = useAppStore();
  const [state, setState] = useReducer(
    (s: FilesState, a: Partial<FilesState>) => ({ ...s, ...a }),
    {
      localCwd: process.env.HOME || process.env.USERPROFILE || "/",
      localEntries: [],
      localLoading: false,
      localError: null,
    } as FilesState,
  );

  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const active = sessions[0];

  const loadLocalDirectory = useCallback(
    async (dir: string) => {
      setState({ localLoading: true, localError: null });
      try {
        const entries = await window.api.localReaddir(dir);
        // Sort: directories first, then alphabetically
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "--";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)}${units[unitIndex]}`;
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString();
  };

  // Load initial directory
  useEffect(() => {
    void loadLocalDirectory(state.localCwd);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.container}
    >
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("workbench.files")}</h1>
          <p className={styles.subtitle}>{t("workbench.filesHint")}</p>
        </div>
        {active && (
          <Button
            variant="secondary"
            onClick={() => navigate(`/session/${active.connectionId}`)}
          >
            {t("workbench.openRemoteFiles")}
          </Button>
        )}
      </header>

      <div className={styles.workbench}>
        <section className={styles.pane}>
          <header className={styles.paneHeader}>
            <span className={styles.paneTitle}>
              {t("workbench.localFiles")}
            </span>
            <span className={styles.path}>{state.localCwd}</span>
          </header>

          <div className={styles.toolbar}>
            <Button
              size="sm"
              variant="ghost"
              title={t("workbench.parent")}
              onClick={handleUpLocal}
              disabled={state.localCwd === "/"}
            >
              <ArrowUp size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title={t("workbench.newFolder")}
              onClick={() => setShowNewFolderInput(true)}
            >
              <FolderPlus size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title={t("workbench.refresh")}
              onClick={() => loadLocalDirectory(state.localCwd)}
              disabled={state.localLoading}
            >
              {state.localLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </Button>
          </div>

          {showNewFolderInput && (
            <div className={styles.newFolderInput}>
              <Input
                placeholder={t("workbench.folderName")}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleNewFolder();
                  } else if (e.key === "Escape") {
                    setShowNewFolderInput(false);
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleNewFolder()}
              >
                {t("workbench.create")}
              </Button>
            </div>
          )}

          <div className={styles.fileList}>
            {state.localLoading ? (
              <div className={styles.centerMessage}>
                {t("workbench.loading")}
              </div>
            ) : state.localError ? (
              <div className={styles.errorMessage}>{state.localError}</div>
            ) : state.localEntries.length === 0 ? (
              <div className={styles.centerMessage}>
                {t("workbench.noFiles")}
              </div>
            ) : (
              state.localEntries.map((entry) => (
                <div key={entry.path} className={styles.fileRow}>
                  <button
                    type="button"
                    className={styles.fileNameBtn}
                    onClick={() =>
                      entry.isDirectory
                        ? handleNavigateLocal(entry.path)
                        : undefined
                    }
                    title={entry.name}
                  >
                    <span className={styles.fileIcon}>
                      {entry.isDirectory ? "📁" : "📄"}
                    </span>
                    <span className={styles.fileName}>{entry.name}</span>
                  </button>
                  <span className={styles.fileMeta}>
                    {formatSize(entry.size)}
                  </span>
                  <span className={styles.fileMeta}>
                    {formatDate(entry.mtimeMs)}
                  </span>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => void handleDeleteLocal(entry)}
                    title={t("workbench.delete")}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.pane}>
          <header className={styles.paneHeader}>
            <span className={styles.paneTitle}>
              {t("workbench.remoteFiles")}
            </span>
            <span className={styles.path}>
              {active
                ? `${active.hostLabel}: /`
                : t("workbench.noActiveSessions")}
            </span>
          </header>
          <div className={styles.fileList}>
            {active ? (
              <Button
                variant="outline"
                onClick={() => navigate(`/session/${active.connectionId}`)}
              >
                {t("workbench.openRemoteFiles")}
              </Button>
            ) : (
              <div className={styles.centerMessage}>
                {t("workbench.noRemoteFiles")}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className={styles.queue}>
        <header className={styles.queueHeader}>
          <span className={styles.queueTitle}>
            {t("workbench.transferQueue")}
          </span>
          <span className={styles.path}>0 {t("workbench.tasks")}</span>
        </header>
        <div className={styles.queueBody}>
          {t("workbench.transferQueueEmpty")}
        </div>
      </section>
    </motion.div>
  );
}
