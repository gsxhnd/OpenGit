/**
 * Primary panel title bar — macOS traffic-light inset when expanded; Win/Linux menubar.
 * Collapsed: narrow strip matching activity bar; chrome moves to MainPanelHeader.
 */
import { AppMenubar } from "../controls/AppMenubar";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { cn } from "@renderer/lib/utils";
import { isDarwin, isDesktopChrome } from "@renderer/lib/shell-chrome";
import styles from "./PrimaryPanelHeader.module.scss";

export function PrimaryPanelHeader() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <header
      className={cn(
        styles.header,
        collapsed && styles.headerCollapsed,
        isDarwin && !collapsed && styles.trafficLightInset,
      )}
    >
      {isDesktopChrome && !collapsed ? (
        <div className={styles.menubarSlot}>
          <AppMenubar />
        </div>
      ) : null}
    </header>
  );
}
