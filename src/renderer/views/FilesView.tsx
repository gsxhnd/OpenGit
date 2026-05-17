import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { SftpPane } from "../components/session/SftpPane";
import { RemoteMonacoEditor } from "../components/editor/RemoteMonacoEditor";
import { useAppStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import { useLocalFilesPane } from "../hooks/files/useLocalFilesPane";
import { LocalFilesPane } from "../components/files/LocalFilesPane";
import { parentPath, joinRemote } from "../lib/sftp/path";
import type { SftpListEntry, SftpTransferProgress } from "@shared/types";
import type { TransferItem } from "../components/session/types";
import styles from "./FilesView.module.scss";

export function FilesView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessions, settings, addToast } = useAppStore(
    useShallow((s) => ({
      sessions: s.sessions,
      settings: s.settings,
      addToast: s.addToast,
    })),
  );
  const active = useMemo(
    () => sessions.find((session) => session.status === "connected"),
    [sessions],
  );

  const {
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
  } = useLocalFilesPane();

  const [remoteCwd, setRemoteCwd] = useState("/");
  const [remoteEntries, setRemoteEntries] = useState<SftpListEntry[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteEditor, setRemoteEditor] = useState<{
    path: string;
    text: string;
  } | null>(null);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);

  const connectionId = active?.connectionId ?? null;

  const refreshRemote = useCallback(
    async (cwd = remoteCwd) => {
      if (!connectionId) return;
      setRemoteLoading(true);
      setRemoteError(null);
      try {
        const entries = (await window.api.sftpReaddir(
          connectionId,
          cwd,
        )) as SftpListEntry[];
        setRemoteEntries(entries);
        setRemoteCwd(cwd);
      } catch (err: unknown) {
        setRemoteError(
          err instanceof Error ? err.message : t("workbench.loadFailed"),
        );
      } finally {
        setRemoteLoading(false);
      }
    },
    [connectionId, remoteCwd, t],
  );

  useEffect(() => {
    if (!connectionId) {
      setRemoteEntries([]);
      setRemoteCwd("/");
      setRemoteEditor(null);
      setRemoteError(null);
      return;
    }
    void refreshRemote("/");
  }, [connectionId, refreshRemote]);

  useEffect(() => {
    if (!connectionId) return;
    const unsubscribe = window.api.onSftpTransferProgress(
      (payload: SftpTransferProgress) => {
        if (payload.connectionId !== connectionId) return;
        setTransfers((prev) => {
          const idx = prev.findIndex(
            (item) =>
              item.path === payload.remotePath && item.kind === payload.kind,
          );
          const nextItem = {
            id: idx >= 0 ? prev[idx].id : prev.length + 1,
            kind: payload.kind,
            path: payload.remotePath,
            bytes: payload.bytes,
            total: payload.total,
            done: payload.done,
            error: payload.error,
          };
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = nextItem;
            return next;
          }
          return [...prev, nextItem];
        });
      },
    );

    return unsubscribe;
  }, [connectionId]);

  const activeTransfers = useMemo(
    () => transfers.filter((transfer) => !transfer.done),
    [transfers],
  );

  const handleNavigateRemote = useCallback(
    async (target: string) => {
      setRemoteEditor(null);
      await refreshRemote(target);
    },
    [refreshRemote],
  );

  const handleNavigateUpRemote = useCallback(async () => {
    await handleNavigateRemote(parentPath(remoteCwd));
  }, [handleNavigateRemote, remoteCwd]);

  const handleOpenRemoteFile = useCallback(
    async (remotePath: string) => {
      if (!connectionId) return;
      try {
        const stat = await window.api
          .sftpStat(connectionId, remotePath)
          .catch(() => null);
        if (stat?.size && stat.size > 1024 * 1024) {
          const ok = window.confirm(
            `File is ${(stat.size / (1024 * 1024)).toFixed(1)}MB. Open in editor? Large files may be slow.`,
          );
          if (!ok) return;
        }
        const text = await window.api.sftpReadFileText(
          connectionId,
          remotePath,
        );
        setRemoteEditor({ path: remotePath, text });
      } catch (err: unknown) {
        window.alert(
          err instanceof Error ? err.message : t("editor.openFileFailed"),
        );
      }
    },
    [connectionId, t],
  );

  const handleRemoteNewFolder = useCallback(async () => {
    if (!connectionId) return;
    const name = window.prompt(t("session.enterFolderName"));
    if (!name?.trim()) return;
    const remotePath = joinRemote(remoteCwd, name.trim());
    try {
      await window.api.sftpMkdir(connectionId, remotePath);
      await refreshRemote(remoteCwd);
    } catch (err: unknown) {
      window.alert(
        err instanceof Error ? err.message : t("session.mkdirFailed"),
      );
    }
  }, [connectionId, remoteCwd, refreshRemote, t]);

  const handleRemoteUpload = useCallback(async () => {
    if (!connectionId) return;
    const localPath = await window.api.openFile();
    if (!localPath) return;
    const fileName = localPath.split(/[/\\]/).pop() || "upload.bin";
    const remotePath = joinRemote(remoteCwd, fileName);
    try {
      const exists = await window.api.sftpExists(connectionId, remotePath);
      if (exists) {
        const ok = window.confirm(
          t("session.overwriteConfirm", { name: fileName }),
        );
        if (!ok) return;
      }
      await window.api.sftpUploadFromLocal(connectionId, remotePath, localPath);
      await refreshRemote(remoteCwd);
    } catch (err: unknown) {
      window.alert(
        err instanceof Error ? err.message : t("session.uploadFailed"),
      );
    }
  }, [connectionId, remoteCwd, refreshRemote, t]);

  const handleRemoteDownload = useCallback(
    async (entry: SftpListEntry) => {
      if (!connectionId || entry.isDirectory) return;
      const remotePath = joinRemote(remoteCwd, entry.name);
      const savePath = await window.api.saveFile(entry.name);
      if (!savePath) return;
      try {
        await window.api.sftpDownloadToLocal(
          connectionId,
          remotePath,
          savePath,
        );
      } catch (err: unknown) {
        window.alert(
          err instanceof Error ? err.message : t("session.downloadFailed"),
        );
      }
    },
    [connectionId, remoteCwd, t],
  );

  const handleRemoteRename = useCallback(
    async (entry: SftpListEntry) => {
      if (!connectionId) return;
      const name = window.prompt(
        t("session.enterNewName", { name: entry.name }),
        entry.name,
      );
      if (!name || name.trim() === entry.name) return;
      const oldPath = joinRemote(remoteCwd, entry.name);
      const newPath = joinRemote(remoteCwd, name.trim());
      try {
        await window.api.sftpRename(connectionId, oldPath, newPath);
        await refreshRemote(remoteCwd);
      } catch (err: unknown) {
        window.alert(
          err instanceof Error ? err.message : t("session.renameFailed"),
        );
      }
    },
    [connectionId, remoteCwd, refreshRemote, t],
  );

  const handleRemoteDelete = useCallback(
    async (entry: SftpListEntry) => {
      if (!connectionId) return;
      const confirmed = window.confirm(
        t("session.confirmDelete", { name: entry.name }),
      );
      if (!confirmed) return;
      const path = joinRemote(remoteCwd, entry.name);
      try {
        if (entry.isDirectory) {
          await window.api.sftpRmdir(connectionId, path);
        } else {
          await window.api.sftpUnlink(connectionId, path);
        }
        await refreshRemote(remoteCwd);
      } catch (err: unknown) {
        window.alert(
          err instanceof Error ? err.message : t("session.deleteFailed"),
        );
      }
    },
    [connectionId, remoteCwd, refreshRemote, t],
  );

  const handleRemoteProperties = useCallback(
    async (entry: SftpListEntry) => {
      if (!connectionId) return;
      const remotePath = joinRemote(remoteCwd, entry.name);
      try {
        const detail = await window.api.sftpStat(connectionId, remotePath);
        window.alert(
          `${detail.name}\n${detail.longname}\nSize: ${detail.size} bytes`,
        );
      } catch (err: unknown) {
        window.alert(err instanceof Error ? err.message : "Stat failed");
      }
    },
    [connectionId, remoteCwd],
  );

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
        <LocalFilesPane
          state={state}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          showNewFolder={showNewFolderInput}
          setShowNewFolder={setShowNewFolderInput}
          onNavigate={handleNavigateLocal}
          onNavigateUp={handleUpLocal}
          onRefresh={() => loadLocalDirectory(state.localCwd)}
          onNewFolder={() => void handleNewFolder()}
          onDelete={(entry) => void handleDeleteLocal(entry)}
          t={t}
          styles={styles}
        />

        {active ? (
          <SftpPane
            connectionId={connectionId!}
            cwd={remoteCwd}
            entries={remoteEntries}
            transfers={activeTransfers}
            labels={{
              parent: t("workbench.parent"),
              newFolder: t("workbench.newFolder"),
              upload: t("session.upload"),
              download: t("workbench.download"),
              rename: t("session.rename"),
              delete: t("session.delete"),
              properties: t("session.properties"),
              refresh: t("workbench.refresh"),
            }}
            onNavigate={handleNavigateRemote}
            onOpenFile={handleOpenRemoteFile}
            onNewFolder={handleRemoteNewFolder}
            onUpload={handleRemoteUpload}
            onRefresh={() => void refreshRemote(remoteCwd)}
            onDownload={handleRemoteDownload}
            onRename={handleRemoteRename}
            onDelete={handleRemoteDelete}
            onProperties={handleRemoteProperties}
          />
        ) : (
          <section className={styles.pane}>
            <header className={styles.paneHeader}>
              <span className={styles.paneTitle}>
                {t("workbench.remoteFiles")}
              </span>
              <span className={styles.path}>
                {t("workbench.noActiveSessions")}
              </span>
            </header>
            <div className={styles.fileList}>
              <div className={styles.centerMessage}>
                {t("workbench.noRemoteFiles")}
              </div>
            </div>
          </section>
        )}
      </div>

      {remoteEditor ? (
        <section className={styles.editorPanel}>
          <RemoteMonacoEditor
            key={remoteEditor.path}
            connectionId={connectionId!}
            remotePath={remoteEditor.path}
            initialText={remoteEditor.text}
            fontSize={settings?.editor?.fontSize ?? 14}
            tabSize={settings?.editor?.tabSize ?? 2}
            wordWrap={settings?.editor?.wordWrap ?? "on"}
            minimap={settings?.editor?.minimap ?? true}
            onClose={() => setRemoteEditor(null)}
            onSaved={() => void refreshRemote(remoteCwd)}
            addToast={(message, kind) => addToast(message, kind)}
          />
        </section>
      ) : null}

      <section className={styles.queue}>
        <header className={styles.queueHeader}>
          <span className={styles.queueTitle}>
            {t("workbench.transferQueue")}
          </span>
          <span className={styles.path}>
            {transfers.length} {t("workbench.tasks")}
          </span>
        </header>
        <div className={styles.queueBody}>
          {activeTransfers.length === 0 ? (
            t("workbench.transferQueueEmpty")
          ) : (
            <div className={styles.queueSummary}>
              {activeTransfers.map((transfer) => (
                <div
                  key={`${transfer.kind}:${transfer.path}`}
                  className={styles.queueItem}
                >
                  <span>
                    {transfer.kind === "upload" ? "↑" : "↓"}{" "}
                    {transfer.path.split("/").pop()}
                  </span>
                  <span>
                    {(
                      (transfer.total > 0
                        ? transfer.bytes / transfer.total
                        : 0) * 100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
