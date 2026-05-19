/**
 * Unified workbench title bar — spans full window width (not split per panel).
 * macOS traffic-light inset, Win/Linux app menu + window controls, command center, panel toggles.
 */
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { AppMenubar } from "../controls/AppMenubar";
import { PrimaryPanelToggle } from "../controls/PrimaryPanelToggle";
import { SecondPanelToggle } from "../controls/SecondPanelToggle";
import { WinControls } from "../controls/WinControls";
import {
  isDarwin,
  isDesktopChrome,
  shellHeaderControlClass,
  shellIconSize,
} from "@renderer/lib/shell-chrome";
import { cn } from "@renderer/lib/utils";
import { useAppStore } from "@renderer/store";
import styles from "./WorkbenchTitleBar.module.scss";

export function WorkbenchTitleBar() {
  const { t } = useTranslation();
  const { sessions, activeSessionId, commandPaletteOpen, toggleCommandPalette } = useAppStore(
    useShallow((s) => ({
      sessions: s.sessions,
      activeSessionId: s.activeSessionId,
      commandPaletteOpen: s.commandPaletteOpen,
      toggleCommandPalette: s.toggleCommandPalette,
    })),
  );
  const activeSession = sessions.find((s) => s.connectionId === activeSessionId);
  const title = activeSession
    ? `${activeSession.username}@${activeSession.host}`
    : "Puck";

  return (
    <header className={styles.header}>
      <div className={cn(styles.leading, isDarwin && styles.trafficLightInset)}>
        {isDesktopChrome ? (
          <div className={styles.menubarSlot}>
            <AppMenubar />
          </div>
        ) : null}
        <div className={cn("no-drag", styles.actions)}>
          <PrimaryPanelToggle
            className={shellHeaderControlClass}
            iconSize={shellIconSize}
          />
        </div>
      </div>

      <div className={styles.titleBlock}>
        <button
          type="button"
          data-command-center
          data-active={commandPaletteOpen ? "" : undefined}
          className={cn("no-drag", styles.commandCenter)}
          onClick={toggleCommandPalette}
          aria-label={t("workbench.status.commandPalette")}
          aria-expanded={commandPaletteOpen}
          aria-haspopup="dialog"
        >
          <span className={styles.commandCenterText}>{title}</span>
        </button>
      </div>

      <div className={styles.trailing}>
        <div className={cn("no-drag", styles.actions)}>
          <SecondPanelToggle
            className={shellHeaderControlClass}
            iconSize={shellIconSize}
          />
        </div>
        {isDesktopChrome ? <WinControls /> : null}
      </div>
    </header>
  );
}
