import {
  ArrowUp,
  FolderPlus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { formatSize, formatDate } from "../../lib/sftp/format";
import type { FilesState } from "../../hooks/files/useLocalFilesPane";
import type { LocalFileEntry } from "@shared/types";

interface LocalFilesPaneProps {
  state: FilesState;
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  showNewFolder: boolean;
  setShowNewFolder: (v: boolean) => void;
  onNavigate: (path: string) => void;
  onNavigateUp: () => void;
  onRefresh: () => void;
  onNewFolder: () => void;
  onDelete: (entry: LocalFileEntry) => void;
  t: (key: string) => string;
  styles: Record<string, string>;
}

export function LocalFilesPane({
  state,
  newFolderName,
  setNewFolderName,
  showNewFolder,
  setShowNewFolder,
  onNavigate,
  onNavigateUp,
  onRefresh,
  onNewFolder,
  onDelete,
  t,
  styles,
}: LocalFilesPaneProps) {
  return (
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
          onClick={onNavigateUp}
          disabled={state.localCwd === "/"}
        >
          <ArrowUp size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          title={t("workbench.newFolder")}
          onClick={() => setShowNewFolder(true)}
        >
          <FolderPlus size={14} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          title={t("workbench.refresh")}
          onClick={onRefresh}
          disabled={state.localLoading}
        >
          {state.localLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
        </Button>
      </div>

      {showNewFolder && (
        <div className={styles.newFolderInput}>
          <Input
            placeholder={t("workbench.folderName")}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onNewFolder();
              } else if (e.key === "Escape") {
                setShowNewFolder(false);
              }
            }}
            autoFocus
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={onNewFolder}
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
              <Button
                variant="ghost"
                size="sm"
                className={styles.fileNameBtn}
                onClick={() =>
                  entry.isDirectory
                    ? onNavigate(entry.path)
                    : undefined
                }
                title={entry.name}
              >
                <span className={styles.fileIcon}>
                  {entry.isDirectory ? "📁" : "📄"}
                </span>
                <span className={styles.fileName}>{entry.name}</span>
              </Button>
              <span className={styles.fileMeta}>
                {formatSize(entry.size)}
              </span>
              <span className={styles.fileMeta}>
                {formatDate(entry.mtimeMs)}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className={styles.deleteBtn}
                onClick={() => onDelete(entry)}
                title={t("workbench.delete")}
              >
                ✕
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
