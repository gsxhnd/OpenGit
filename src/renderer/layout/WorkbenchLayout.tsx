/**
 * Main workbench layout — Activity Bar, Primary Sidebar, Session Tabs,
 * routed views, optional Inspector, and Status Bar.
 */
import { Outlet, useLocation } from "react-router";
import { useAppStore } from "../store";
import { ActivityBar } from "../components/shell/ActivityBar";
import { PrimarySidebar } from "../components/shell/PrimarySidebar";
import { SessionTabs } from "../components/shell/SessionTabs";
import { PanelContainer } from "../components/shell/PanelContainer";
import { InspectorPanel } from "../components/shell/InspectorPanel";
import { StatusBar } from "../components/shell/StatusBar";
import { TitleBar } from "../components/shell/TitleBar";
import styles from "./WorkbenchLayout.module.scss";

export function WorkbenchLayout() {
  const location = useLocation();
  const { inspectorOpen, setInspectorOpen, toggleCommandPalette } = useAppStore();
  const showSessionTabs = location.pathname !== "/";

  return (
    <div className={styles.container}>
      <TitleBar onOpenCommandPalette={() => toggleCommandPalette()} />
      <div className={styles.bodyRow}>
        <ActivityBar />
        <PrimarySidebar />
        <main className={styles.mainContent}>
          <div className={styles.workbenchSplit}>
            <div className={styles.workbenchMain}>
              {showSessionTabs ? <SessionTabs /> : null}
              <PanelContainer>
                <Outlet />
              </PanelContainer>
            </div>
            {inspectorOpen ? (
              <InspectorPanel onClose={() => setInspectorOpen(false)} />
            ) : null}
          </div>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
