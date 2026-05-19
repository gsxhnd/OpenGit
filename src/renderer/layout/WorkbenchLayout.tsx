/**
 * Main workbench layout — 3-column panel architecture with horizontal resize.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
import { WorkbenchTitleBar } from "./headers/WorkbenchTitleBar";
import { SecondPanel } from "./SecondPanel";
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
  const { secondPanelOpen, setSecondPanelOpen, settings, updateSettings } = useAppStore(
    useShallow((s) => ({
      secondPanelOpen: s.secondPanelOpen,
      setSecondPanelOpen: s.setSecondPanelOpen,
      settings: s.settings,
      updateSettings: s.updateSettings,
    })),
  );
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const showSessionTabs = location.pathname !== "/" && location.pathname !== "/connections";
  const primaryPanelRef = usePanelRef();
  const secondPanelRef = usePanelRef();

  const defaultLayout = useMemo(
    () => loadWorkbenchPanelLayout() ?? DEFAULT_WORKBENCH_LAYOUT,
    [],
  );

  // Keep primary panel collapse in sync with sidebar visibility. Re-run when the
  // second panel opens/closes — layout redistribution can auto-collapse primary.
  useLayoutEffect(() => {
    const panel = primaryPanelRef.current;
    if (!panel) return;
    if (collapsed) {
      if (!panel.isCollapsed()) panel.collapse();
    } else if (panel.isCollapsed()) {
      panel.expand();
    }
  }, [collapsed, secondPanelOpen, primaryPanelRef]);

  // Always mount the second panel; collapse instead of unmounting to avoid
  // react-resizable-panels redistributing layout and collapsing primary.
  useLayoutEffect(() => {
    const panel = secondPanelRef.current;
    if (!panel) return;
    if (secondPanelOpen) {
      if (panel.isCollapsed()) panel.expand();
    } else if (!panel.isCollapsed()) {
      panel.collapse();
    }
  }, [secondPanelOpen, secondPanelRef]);

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
      <WorkbenchTitleBar />
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
          {showSessionTabs ? <SessionTabs /> : null}
          <PanelContainer>
            <Outlet />
          </PanelContainer>
        </ResizablePanel>

        <ResizableHandle
          className={styles.resizeHandle}
          disabled={!secondPanelOpen}
        />
        <ResizablePanel
          id={WORKBENCH_PANEL_IDS.second}
          panelRef={secondPanelRef}
          collapsible
          collapsedSize="0px"
          minSize={SECOND_PANEL_MIN_PX}
          maxSize="55%"
          defaultSize={
            defaultLayout[WORKBENCH_PANEL_IDS.second] ??
            `${SECOND_PANEL_DEFAULT_PX}px`
          }
          className={styles.secondPanel}
        >
          <div className={styles.secondPanelBody}>
            {secondPanelOpen ? <SecondPanel /> : null}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <StatusBar />
    </div>
  );
}
