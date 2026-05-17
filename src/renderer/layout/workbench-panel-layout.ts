import type { Layout } from "react-resizable-panels";

export const WORKBENCH_PANEL_IDS = {
  primary: "primary",
  main: "main",
  second: "second",
} as const;

const STORAGE_KEY = "puck.workbench.panelLayout";

/** Activity bar width — keep in sync with `--activity-bar-width` in index.css */
export const ACTIVITY_BAR_WIDTH_PX = 36;

/** Min primary panel width when sidebar expanded (activity bar + min sidebar) */
export const PRIMARY_PANEL_MIN_PX = 196;

/** Second panel default / min width in px */
export const SECOND_PANEL_DEFAULT_PX = 280;
export const SECOND_PANEL_MIN_PX = 200;

export const DEFAULT_WORKBENCH_LAYOUT: Layout = {
  [WORKBENCH_PANEL_IDS.primary]: 22,
  [WORKBENCH_PANEL_IDS.main]: 58,
  [WORKBENCH_PANEL_IDS.second]: 20,
};

export function loadWorkbenchPanelLayout(): Layout | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return undefined;
    return parsed as Layout;
  } catch {
    return undefined;
  }
}

export function saveWorkbenchPanelLayout(layout: Layout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore quota / private mode */
  }
}
