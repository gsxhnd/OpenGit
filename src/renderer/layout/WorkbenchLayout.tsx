/**
 * Main workbench layout — 3-column panel architecture with horizontal resize.
 */
import { useEffect, useMemo, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import { usePanelRef } from "react-resizable-panels";
import { useShallow } from "zustand/react/shallow";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui/resizable";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { useAppStore } from "@renderer/store";
import { ActivityBar } from "./ActivityBar";
import { PanelContainer } from "./PanelContainer";
import { PrimarySidebar } from "./PrimarySidebar";
import { SessionTabs } from "./SessionTabs";
import { StatusBar } from "./StatusBar";
import { MainPanelHeader } from "./headers/MainPanelHeader";
import { PrimaryPanelHeader } from "./headers/PrimaryPanelHeader";
import { SecondPanel } from "./SecondPanel";
import { SecondPanelHeader } from "./headers/SecondPanelHeader";
import {
  ACTIVITY_BAR_WIDTH_PX,
  DEFAULT_WORKBENCH_LAYOUT,
  loadWorkbenchPanelLayout,
  PRIMARY_PANEL_MIN_PX,
  saveWorkbenchPanelLayout,
  SECOND_PANEL_DEFAULT_PX,
  SECOND_PANEL_MIN_PX,
  WORKBENCH_PANEL_IDS,
} from "./workbench-panel-layout";
import styles from "./WorkbenchLayout.module.scss";

export function WorkbenchLayout() {
  const location = useLocation();
  const { secondPanelOpen, toggleCommandPalette, setSecondPanelOpen, settings, updateSettings } = useAppStore(
    useShallow((s) => ({
      secondPanelOpen: s.secondPanelOpen,
      toggleCommandPalette: s.toggleCommandPalette,
      setSecondPanelOpen: s.setSecondPanelOpen,
      settings: s.settings,
      updateSettings: s.updateSettings,
    })),
  );
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const showSessionTabs = location.pathname !== "/" && location.pathname !== "/connections";
  const primaryPanelRef = usePanelRef();

  const defaultLayout = useMemo(
    () => loadWorkbenchPanelLayout() ?? DEFAULT_WORKBENCH_LAYOUT,
    [],
  );

  useEffect(() => {
    const panel = primaryPanelRef.current;
    if (!panel) return;
    if (collapsed) {
      if (!panel.isCollapsed()) panel.collapse();
    } else if (panel.isCollapsed()) {
      panel.expand();
    }
  }, [collapsed, primaryPanelRef]);

  const sidebarRestored = useRef(false);

  useEffect(() => {
    if (!sidebarRestored.current && settings?.sidebar) {
      sidebarRestored.current = true;
      setSecondPanelOpen(settings.sidebar.secondOpen);
    }
  }, [settings, setSecondPanelOpen]);

  useEffect(() => {
    if (sidebarRestored.current) {
      const s = useAppStore.getState().settings;
      if (s) {
        void updateSettings({
          ...s,
          sidebar: { ...s.sidebar, secondOpen: secondPanelOpen },
        });
      }
    }
  }, [secondPanelOpen, updateSettings]);

  return (
    <div className={styles.container}>
      <ResizablePanelGroup
        id="workbench-panels"
        className={styles.panelRow}
        defaultLayout={defaultLayout}
        onLayoutChanged={saveWorkbenchPanelLayout}
      >
        <ResizablePanel
          id={WORKBENCH_PANEL_IDS.primary}
          panelRef={primaryPanelRef}
          collapsible
          collapsedSize={`${ACTIVITY_BAR_WIDTH_PX}px`}
          minSize={PRIMARY_PANEL_MIN_PX}
          maxSize="48%"
          defaultSize={defaultLayout[WORKBENCH_PANEL_IDS.primary]}
          className={styles.primaryPanel}
        >
          <PrimaryPanelHeader />
          <div className={styles.primaryPanelBody}>
            <ActivityBar />
            {!collapsed ? <PrimarySidebar /> : null}
          </div>
        </ResizablePanel>

        <ResizableHandle
          className={styles.resizeHandle}
          disabled={collapsed}
        />

        <ResizablePanel
          id={WORKBENCH_PANEL_IDS.main}
          minSize="28%"
          defaultSize={defaultLayout[WORKBENCH_PANEL_IDS.main]}
          className={styles.mainPanel}
        >
          <MainPanelHeader onOpenCommandPalette={() => toggleCommandPalette()} />
          {showSessionTabs ? <SessionTabs /> : null}
          <PanelContainer>
            <Outlet />
          </PanelContainer>
        </ResizablePanel>

        {secondPanelOpen ? (
          <>
            <ResizableHandle className={styles.resizeHandle} />
            <ResizablePanel
              id={WORKBENCH_PANEL_IDS.second}
              minSize={SECOND_PANEL_MIN_PX}
              maxSize="55%"
              defaultSize={
                defaultLayout[WORKBENCH_PANEL_IDS.second] ??
                `${SECOND_PANEL_DEFAULT_PX}px`
              }
              className={styles.secondPanel}
            >
              <SecondPanelHeader />
              <div className={styles.secondPanelBody}>
                <SecondPanel />
              </div>
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>

      <StatusBar />
    </div>
  );
}
