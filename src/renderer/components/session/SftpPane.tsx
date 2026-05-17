import type { SftpListEntry } from "@shared/types";
import { ArrowUp, FolderPlus, Upload, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { SftpTreeView } from "../sftp/SftpTreeView";
import { parentPath } from "../../lib/sftp/path";
import type { TransferItem } from "./types";
import { TransferQueue } from "./TransferQueue";
import styles from "./SftpPane.module.scss";

interface SftpPaneProps {
  connectionId: string;
  cwd: string;
  entries: SftpListEntry[];
  transfers: TransferItem[];
  labels: {
    parent: string;
    newFolder: string;
    upload: string;
    refresh: string;
    download: string;
    rename: string;
    delete: string;
    properties: string;
  };
  onNavigate: (path: string) => void;
  onOpenFile: (path: string) => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onRefresh: () => void;
  onDownload: (entry: SftpListEntry) => void;
  onRename: (entry: SftpListEntry) => void;
  onDelete: (entry: SftpListEntry) => void;
  onProperties: (entry: SftpListEntry) => void;
}

export function SftpPane({
  connectionId,
  cwd,
  entries,
  transfers,
  labels,
  onNavigate,
  onOpenFile,
  onNewFolder,
  onUpload,
  onRefresh,
  onDownload,
  onRename,
  onDelete,
  onProperties,
}: SftpPaneProps) {
  const parts = cwd.split("/").filter(Boolean);

  return (
    <aside className={styles.sftp}>
      <div className={styles.sftpToolbar}>
        <Button
          size="sm"
          variant="ghost"
          title={labels.parent}
          onClick={() => onNavigate(parentPath(cwd))}
        >
          <ArrowUp size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          title={labels.newFolder}
          onClick={onNewFolder}
        >
          <FolderPlus size={14} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          title={labels.refresh}
          onClick={onRefresh}
        >
          <RefreshCw size={14} />
        </Button>
        <Button size="sm" variant="secondary" onClick={onUpload}>
          <Upload size={14} className="mr-1" />
          {labels.upload}
        </Button>
      </div>
      <div className={styles.breadcrumb}>
        <button
          type="button"
          className={styles.breadcrumbItem}
          onClick={() => onNavigate("/")}
        >
          /
        </button>
        {parts.map((part, index) => {
          const path = "/" + parts.slice(0, index + 1).join("/");
          return (
            <span key={path}>
              <span className={styles.breadcrumbSep}>/</span>
              <button
                type="button"
                className={styles.breadcrumbItem}
                onClick={() => onNavigate(path)}
              >
                {part}
              </button>
            </span>
          );
        })}
      </div>
      <TransferQueue transfers={transfers} />
      <SftpTreeView
        connectionId={connectionId}
        cwd={cwd}
        entries={entries}
        labels={{
          newFolder: labels.newFolder,
          download: labels.download,
          rename: labels.rename,
          delete: labels.delete,
          properties: labels.properties,
        }}
        onNavigate={onNavigate}
        onOpenFile={onOpenFile}
        onNewFolder={onNewFolder}
        onDownload={onDownload}
        onRename={onRename}
        onDelete={onDelete}
        onProperties={onProperties}
      />
    </aside>
  );
}
