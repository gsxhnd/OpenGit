import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { useAppStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import { useLocalFilesPane } from "../hooks/useLocalFilesPane";
import { LocalFilesPane } from "../components/files/LocalFilesPane";
import styles from "./FilesView.module.scss";

export function FilesView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sessions } = useAppStore(useShallow((s) => ({ sessions: s.sessions })));
  const active = sessions[0];

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
