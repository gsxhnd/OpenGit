/**
 * Phase 1 — 统一 **本地 / SSH** 终端 chrome：徽章、标题、连接状态、元信息行。
 * 实际 PTY/SSH 字节流由子组件 `XtermPane` 根据 `mode` 分流到 preload API。
 */
import type { TerminalSettings, RemoteSessionMeta } from "@shared/types";
import { XtermPane, type XtermMode } from "./XtermPane";
import styles from "./TerminalPanel.module.scss";

interface TerminalPanelProps {
  mode: XtermMode;
  title: string;
  protocol: "Local" | "SSH";
  status: "connecting" | "connected" | "disconnected";
  settings?: TerminalSettings;
  session?: RemoteSessionMeta;
  onExit?: (error?: Error) => void;
}

export function TerminalPanel({
  mode,
  title,
  protocol,
  status,
  settings,
  session,
  onExit,
}: TerminalPanelProps) {
  const meta = session
    ? `${session.username}@${session.host}:${session.port}`
    : (settings?.windowsShell ?? "shell");

  return (
    <section
      className={styles.terminalPanel}
      aria-label={`${protocol} terminal`}
    >
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.badge}>{protocol}</span>
          <span className={styles.title}>{title}</span>
          <span className={styles.status} data-state={status}>
            {status}
          </span>
        </div>
        <div className={styles.metaGroup}>
          <span className={styles.meta}>{meta}</span>
        </div>
      </header>
      <div className={styles.body}>
        <XtermPane
          mode={mode}
          fontSize={settings?.fontSize ?? 14}
          fontFamily={settings?.fontFamily ?? "Menlo, Monaco, monospace"}
          scrollback={settings?.scrollback ?? 5000}
          cursorStyle={settings?.cursorStyle ?? "block"}
          windowsShell={settings?.windowsShell ?? "powershell"}
          onExit={onExit}
        />
      </div>
    </section>
  );
}
