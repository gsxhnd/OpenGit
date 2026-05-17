/**
 * Main workbench layout — 3-column panel architecture.
 *
 * Each panel is a full-height column with its own header (layout-owned):
 *   Primary Panel  — ActivityBar + PrimarySidebar
 *   Main Panel     — SessionTabs + routed content
 *   Second Panel   — optional right panel (properties, transfers, diagnostics)
 *
 * Win/Linux window controls live in the rightmost visible panel's header.
 */
import { Outlet, useLocation } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { ActivityBar } from "./ActivityBar";
import { PanelContainer } from "./PanelContainer";
import { PrimarySidebar } from "./PrimarySidebar";
import { SessionTabs } from "./SessionTabs";
import { StatusBar } from "./StatusBar";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { cn } from "@renderer/lib/utils";
import { useAppStore } from "@renderer/store";
import { MainPanelHeader } from "./headers/MainPanelHeader";
import { PrimaryPanelHeader } from "./headers/PrimaryPanelHeader";
import { SecondPanel } from "./SecondPanel";
import { SecondPanelHeader } from "./headers/SecondPanelHeader";
import styles from "./WorkbenchLayout.module.scss";

export function WorkbenchLayout() {
  const location = useLocation();
  const { secondPanelOpen, toggleCommandPalette } = useAppStore(
    useShallow((s) => ({
      secondPanelOpen: s.secondPanelOpen,
      toggleCommandPalette: s.toggleCommandPalette,
    })),
  );
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const showSessionTabs = location.pathname !== "/";

  return (
    <div className={styles.container}>
      <div className={styles.panelRow}>
        <div className={cn(styles.primaryPanel, collapsed && styles.primaryPanelCollapsed)}>
          <PrimaryPanelHeader />
          <div className={styles.primaryPanelBody}>
            <ActivityBar />
            {!collapsed ? <PrimarySidebar /> : null}
          </div>
        </div>

        <div className={styles.mainPanel}>
          <MainPanelHeader onOpenCommandPalette={() => toggleCommandPalette()} />
          {showSessionTabs ? <SessionTabs /> : null}
          <PanelContainer>
            <Outlet />
          </PanelContainer>
        </div>

        {secondPanelOpen ? (
          <aside
            className={styles.secondPanel}
            aria-label="Second panel"
          >
            <SecondPanelHeader />
            <SecondPanel />
          </aside>
        ) : null}
      </div>

      <StatusBar />
    </div>
  );
}
