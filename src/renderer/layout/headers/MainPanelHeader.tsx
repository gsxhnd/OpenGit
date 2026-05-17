/**
 * Main panel title bar — primary/second panel toggles on the sides,
 * session title + command palette centered. Win/Linux window controls when second panel is closed.
 */
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { AppMenubar } from "../controls/AppMenubar";
import { PrimaryPanelToggle } from "../controls/PrimaryPanelToggle";
import { SecondPanelToggle } from "../controls/SecondPanelToggle";
import { ShellTooltip } from "@renderer/components/common/ShellTooltip";
import { useSidebar } from "@renderer/components/ui/sidebar";
import {
  isDarwin,
  isDesktopChrome,
  shellHeaderControlClass,
  shellIconSize,
} from "@renderer/lib/shell-chrome";
import { cn } from "@renderer/lib/utils";
import { useAppStore } from "@renderer/store";
import { WinControls } from "../controls/WinControls";
import styles from "./MainPanelHeader.module.scss";

interface MainPanelHeaderProps {
  onOpenCommandPalette?: () => void;
}

export function MainPanelHeader({ onOpenCommandPalette }: MainPanelHeaderProps = {}) {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const primaryCollapsed = state === "collapsed";
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
      <div
        className={cn(
          styles.leading,
          isDarwin && primaryCollapsed && styles.leadingTrafficLightInset,
        )}
      >
        {isDesktopChrome && primaryCollapsed ? (
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
        <div className={styles.title}>
          <span className={styles.titleText}>{title}</span>
        </div>
        {onOpenCommandPalette ? (
          <div className={cn("no-drag", styles.commandPaletteTrigger)}>
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
          </div>
        ) : null}
      </div>
      <div className={styles.trailing}>
        <div className={cn("no-drag", styles.actions)}>
          <SecondPanelToggle
            className={shellHeaderControlClass}
            iconSize={shellIconSize}
          />
        </div>
        {showWinControls ? <WinControls /> : null}
      </div>
    </header>
  );
}
