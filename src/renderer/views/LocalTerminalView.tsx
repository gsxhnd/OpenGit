/**
 * 本地 PTY 会话视图（Phase 1 — 与 `SessionView` 共用 `TerminalPanel` / `XtermPane`）。
 * 子进程退出后提供「新建 Shell」以重新挂载终端，无需离开路由。
 * 包含改进的错误处理和状态提示。
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, RotateCw } from "lucide-react";
import { useAppStore } from "../store";
import { TerminalPanel } from "../components/terminal/TerminalPanel";
import { Button } from "../components/ui/button";
import styles from "./LocalTerminalView.module.scss";

export function LocalTerminalView() {
  const { t } = useTranslation();
  const { settings, addToast } = useAppStore();
  const term = settings?.terminal;
  /** 递增 key 以在 PTY 退出后强制重新挂载 `XtermPane`，从而再次调用 `ptyLocalCreate`。 */
  const [terminalKey, setTerminalKey] = useState(0);
  const [localExited, setLocalExited] = useState(false)

  const spawnNewLocalShell = useCallback(() => {
    setLocalExited(false)
    setTerminalKey((k) => k + 1)
    addToast(t("localTerminal.shellRestarted"), "success")
  }, [addToast, t])

  const handleTerminalExit = useCallback(
    () => {
      setLocalExited(true)
      addToast(t("localTerminal.exitedHint"), "info")
    },
    [addToast, t],
  );

  return (
    <div className={styles.wrap}>
      {localExited ? (
        <div className={styles.exitedBar} role="status">
          <div className={styles.exitedMessage}>
            <AlertCircle size={16} />
            <span className={styles.exitedHint}>
              {t("localTerminal.exitedHint")}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={spawnNewLocalShell}
          >
            <RotateCw size={14} className="mr-1" />
            {t("localTerminal.restart")}
          </Button>
        </div>
      ) : null}
      <div className={styles.term}>
        {!localExited ? (
          <TerminalPanel
            key={terminalKey}
            mode={{ kind: "local" }}
            title={t("localTerminal.title")}
            protocol="Local"
            status="connected"
            settings={term}
            onExit={handleTerminalExit}
          />
        ) : null}
      </div>
    </div>
  );
}
