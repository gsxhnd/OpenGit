/**
 * Primary panel title bar — collapse toggle; Win/Linux menubar.
 */
import { ChevronLeft, ChevronRight, PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppMenubar } from "@renderer/components/shell/AppMenubar";
import { ShellTooltip } from "@renderer/components/shell/ShellTooltip";
import { Button } from "@renderer/components/ui/button";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { cn } from "@renderer/lib/utils";
import { isDarwin, isDesktopChrome } from "@renderer/lib/shell-chrome";
import styles from "./PrimaryPanelHeader.module.scss";

export function PrimaryPanelHeader() {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  if (collapsed) {
    return (
      <header className={cn(styles.header, styles.headerCollapsed)}>
        <div className={cn("no-drag", styles.actions, "px-0")}>
          <ShellTooltip
            content={t("workbench.expandSidebar")}
            side="bottom"
            delay={400}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label={t("workbench.expandSidebar")}
            >
              <PanelLeft size={15} strokeWidth={1.5} />
            </Button>
          </ShellTooltip>
        </div>
      </header>
    );
  }

  return (
    <header className={cn(styles.header, isDarwin && styles.trafficLightInset)}>
      {isDesktopChrome ? (
        <div className={styles.menubarSlot}>
          <AppMenubar />
        </div>
      ) : null}
      <div className={styles.spacer} />
      <div className={cn("no-drag", styles.actions)}>
        <ShellTooltip
          content={t("workbench.collapseSidebar")}
          side="bottom"
          delay={400}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label={t("workbench.collapseSidebar")}
          >
            <PanelLeft size={15} strokeWidth={1.5} />
          </Button>
        </ShellTooltip>
      </div>
    </header>
  );
}
