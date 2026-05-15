/**
 * Main panel title bar — session title, second panel toggle, command palette.
 * Win/Linux window controls when the second panel is closed.
 */
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { SecondPanelToggle } from "@renderer/components/shell/SecondPanelToggle";
import { ShellTooltip } from "@renderer/components/shell/ShellTooltip";
import {
  isDesktopChrome,
  shellHeaderControlClass,
  shellIconSize,
} from "@renderer/lib/shell-chrome";
import { cn } from "@renderer/lib/utils";
import { useAppStore } from "@renderer/store";
import { WinControls } from "./WinControls";
import styles from "./MainPanelHeader.module.scss";

interface MainPanelHeaderProps {
  onOpenCommandPalette?: () => void;
}

export function MainPanelHeader({ onOpenCommandPalette }: MainPanelHeaderProps = {}) {
  const { t } = useTranslation();
  const { sessions, activeSessionId, secondPanelOpen } = useAppStore(
    useShallow((s) => ({
      sessions: s.sessions,
      activeSessionId: s.activeSessionId,
      secondPanelOpen: s.secondPanelOpen,
    })),
  );
  const activeSession = sessions.find((s) => s.connectionId === activeSessionId);
  const title = activeSession
    ? `${activeSession.username}@${activeSession.host}`
    : "Puck";
  const showWinControls = isDesktopChrome && !secondPanelOpen;

  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <span className={styles.titleText}>{title}</span>
      </div>
      <div className={cn("no-drag", styles.actions)}>
        <SecondPanelToggle
          className={shellHeaderControlClass}
          iconSize={shellIconSize}
        />
        {onOpenCommandPalette ? (
          <ShellTooltip
            content={t("workbench.status.commandPalette")}
            side="bottom"
            delay={400}
          >
            <button
              type="button"
              className={`flex items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)] ${shellHeaderControlClass}`}
              onClick={onOpenCommandPalette}
              aria-label={t("workbench.status.commandPalette")}
            >
              <Search size={shellIconSize} strokeWidth={1.5} />
            </button>
          </ShellTooltip>
        ) : null}
      </div>
      {showWinControls ? <WinControls /> : null}
    </header>
  );
}
