/**
 * Main workbench layout — 3-column panel architecture.
 *
 * Each panel is a full-height column with its own header:
 *   Primary Panel  — ActivityBar (icon-only) + PrimarySidebar
 *   Main Panel     — SessionTabs + routed content
 *   Second Panel   — optional right panel (properties, transfers, diagnostics)
 *
 * Win/Linux window controls live in the rightmost visible panel's header.
 *
 * Structure:
 *   .container (column flex, full height)
 *     .panelRow (row flex, flex:1)
 *       .primaryPanel (column flex, shrink-0)
 *         PrimaryPanelHeader
 *         .primaryPanelBody (ActivityBar + PrimarySidebar)
 *       .mainPanel (column flex, flex:1)
 *         MainHeader
 *         SessionTabs (conditional)
 *         PanelContainer (<Outlet />)
 *       .secondPanel (column flex, shrink-0, conditional)
 *         SecondPanel (has its own header internally)
 *     StatusBar
 */
import { Outlet, useLocation } from "react-router";
import { useAppStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import { useSidebar } from "../components/ui/sidebar";
import { ActivityBar } from "../components/shell/ActivityBar";
import { PrimarySidebar } from "../components/shell/PrimarySidebar";
import { PrimaryPanelHeader } from "../components/shell/PrimaryPanelHeader";
import { MainHeader } from "../components/shell/MainHeader";
import { SessionTabs } from "../components/shell/SessionTabs";
import { PanelContainer } from "../components/shell/PanelContainer";
import { SecondPanel } from "../components/shell/SecondPanel";
import { StatusBar } from "../components/shell/StatusBar";
import styles from "./WorkbenchLayout.module.scss";

export function WorkbenchLayout() {
  const location = useLocation();
  const { secondPanelOpen, setSecondPanelOpen, toggleCommandPalette } = useAppStore(
    useShallow((s) => ({
      secondPanelOpen: s.secondPanelOpen,
      setSecondPanelOpen: s.setSecondPanelOpen,
      toggleCommandPalette: s.toggleCommandPalette,
    })),
  );
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const showSessionTabs = location.pathname !== "/";

  return (
    <div className={styles.container}>
      {/* 3-column panel row */}
      <div className={styles.panelRow}>
        {/* Primary Panel */}
        <div className={styles.primaryPanel}>
          <PrimaryPanelHeader />
          <div className={styles.primaryPanelBody}>
            <ActivityBar />
            {!collapsed && <PrimarySidebar />}
          </div>
        </div>

        {/* Main Panel */}
        <div className={styles.mainPanel}>
          <MainHeader onOpenCommandPalette={() => toggleCommandPalette()} />
          {showSessionTabs ? <SessionTabs /> : null}
          <PanelContainer>
            <Outlet />
          </PanelContainer>
        </div>

        {/* Second Panel (optional) */}
        {secondPanelOpen ? (
          <SecondPanel onClose={() => setSecondPanelOpen(false)} />
        ) : null}
      </div>

      <StatusBar />
    </div>
  );
}
