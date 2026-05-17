/**
 * SSH 会话工作区：左侧 SFTP、右侧远程 Shell（xterm）与可选 Monaco 编辑器。
 * Phase 1：Shell 与 SSH 连接解耦 — 流关闭后 SFTP/编辑器仍可用，用户可「重新连接 Shell」。
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import { useSessionPerConnectionState } from "../hooks/session/useSessionPerConnectionState";
import { useRemoteShellLifecycle } from "../hooks/session/useRemoteShellLifecycle";
import { useSessionSftpOperations } from "../hooks/session/useSessionSftpOperations";
import { SessionHeader } from "../components/session/SessionHeader";
import { SftpPane } from "../components/session/SftpPane";
import { NewFolderDialog } from "../components/session/NewFolderDialog";
import { PropertiesDialog } from "../components/session/PropertiesDialog";
import { SessionShellPanel } from "../components/session/SessionShellPanel";
import { SessionEditorPanel } from "../components/session/SessionEditorPanel";
import type { PropertiesModalState } from "../components/session/types";
import styles from "./SessionView.module.scss";

export function SessionView() {
  const { t } = useTranslation();
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { sessions, activeSessionId, setActiveSessionId, settings, addToast } =
    useAppStore(
      useShallow((s) => ({
        sessions: s.sessions,
        activeSessionId: s.activeSessionId,
        setActiveSessionId: s.setActiveSessionId,
        settings: s.settings,
        addToast: s.addToast,
      })),
    );

  const cid = connectionId || "";
  const meta = sessions.find((s) => s.connectionId === cid);
  const term = settings?.terminal;
  const ed = settings?.editor;

  const { getState, rerender, stateMapRef } = useSessionPerConnectionState(cid);
  const { startRemoteShell, disconnect } = useRemoteShellLifecycle(
    cid,
    meta,
    getState,
    rerender,
  );

  const refreshDir = useCallback(async () => {
    if (!cid) return;
    const s = getState();
    s.loadingDir = true;
    rerender();
    try {
      const list = await window.api.sftpReaddir(cid, s.cwd);
      s.entries = list;
    } catch (e: unknown) {
      addToast(
        e instanceof Error ? e.message : t("session.sftpListFailed"),
        "error",
      );
    } finally {
      s.loadingDir = false;
      rerender();
    }
  }, [cid, addToast, t, getState, rerender]);

  const {
    openFile,
    navigateTo,
    handleNewFolder,
    submitNewFolder,
    handleRename,
    handleDelete,
    handleProperties,
    handleUpload,
    handleDownload,
  } = useSessionSftpOperations(cid, getState, rerender, refreshDir);

  const [propsModal, setPropsModal] = useState<PropertiesModalState>({
    entry: null,
    detail: null,
  });
  const [newFolderPrompt, setNewFolderPrompt] = useState(false);
  const [newFolderValue, setNewFolderValue] = useState("");

  useEffect(() => {
    if (!cid || !meta) {
      addToast(t("session.invalidSession"), "error");
      navigate("/");
      return;
    }
    if (activeSessionId !== cid) {
      setActiveSessionId(cid);
    }
  }, [cid, meta, activeSessionId, addToast, navigate, setActiveSessionId, t]);

  useEffect(() => {
    if (meta) void refreshDir();
  }, [refreshDir, meta]);

  useEffect(() => {
    return () => {
      stateMapRef.current.delete(cid);
    };
  }, [cid, stateMapRef]);

  if (!meta) return null;

  const st = getState();
  const activeTransfers = st.transfers.filter((tr) => !tr.done);

  return (
    <div className={styles.root}>
      <SessionHeader
        meta={meta}
        fingerprint={meta.fingerprint}
        disconnectLabel={t("session.disconnect")}
        onDisconnect={() => void disconnect()}
      />

      <div className={styles.body}>
        <SftpPane
          connectionId={cid}
          cwd={st.cwd}
          entries={st.entries}
          transfers={activeTransfers}
          labels={{
            parent: t("session.parent"),
            newFolder: t("session.newFolder"),
            upload: t("session.upload"),
            refresh: t("workbench.refresh"),
            download: t("workbench.download"),
            rename: t("session.rename"),
            delete: t("session.delete"),
            properties: t("session.properties"),
          }}
          onNavigate={navigateTo}
          onOpenFile={(path) => {
            void openFile(path);
          }}
          onNewFolder={() =>
            handleNewFolder(setNewFolderValue, setNewFolderPrompt)
          }
          onUpload={() => {
            void handleUpload();
          }}
          onRefresh={() => {
            void refreshDir();
          }}
          onDownload={(entry) => {
            void handleDownload(entry);
          }}
          onRename={handleRename}
          onDelete={handleDelete}
          onProperties={async (entry) => {
            const result = await handleProperties(entry);
            if (result) setPropsModal(result);
          }}
        />

        <div className={styles.mainCol}>
          <SessionShellPanel
            shellPhase={st.shellPhase}
            cid={cid}
            meta={meta}
            term={term}
            onReconnect={() => void startRemoteShell(true)}
            onExit={() => {
              const s = getState();
              s.shellPhase = "exited";
              useAppStore.getState().updateSessionStatus(cid, "disconnected");
              rerender();
              addToast(t("session.shellClosed"), "info");
            }}
            labels={{
              starting: t("session.startingShell"),
              exitedHint: t("session.shellExitedHint"),
              reconnect: t("session.reconnectShell"),
            }}
          />
          {st.editor && ed && (
            <SessionEditorPanel
              editor={st.editor}
              ed={ed}
              cid={cid}
              onClose={() => {
                st.editor = null;
                rerender();
              }}
              onSaved={() => void refreshDir()}
              addToast={addToast}
            />
          )}
        </div>
      </div>

      {newFolderPrompt ? (
        <NewFolderDialog
          value={newFolderValue}
          labels={{
            title: t("session.newFolder"),
            placeholder: t("session.enterFolderName"),
            cancel: t("ui.cancel"),
            add: t("ui.add"),
          }}
          onChange={setNewFolderValue}
          onCancel={() => setNewFolderPrompt(false)}
          onSubmit={() => {
            void submitNewFolder(newFolderValue, setNewFolderPrompt);
          }}
        />
      ) : null}

      {propsModal.detail ? (
        <PropertiesDialog
          detail={propsModal.detail}
          labels={{ title: t("session.properties"), close: t("ui.close") }}
          onClose={() => setPropsModal({ entry: null, detail: null })}
        />
      ) : null}
    </div>
  );
}
