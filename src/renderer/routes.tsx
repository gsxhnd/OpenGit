import type { ViewType } from "@shared/types";
import { WelcomeView } from "./views/WelcomeView";
import { CommitView } from "./views/CommitView";
import { HistoryView } from "./views/HistoryView";
import { BranchesView } from "./views/BranchesView";
import { DiffView } from "./views/DiffView";
import { StashView } from "./views/StashView";
import { TagsView } from "./views/TagsView";
import { GraphView } from "./views/GraphView";
import { CommitDetailView } from "./views/CommitDetailView";
import { FileSearchView } from "./views/FileSearchView";
import { FileHistoryView } from "./views/FileHistoryView";
import { BlameView } from "./views/BlameView";
import { ReflogView } from "./views/ReflogView";
import { SettingsView } from "./views/SettingsView";
import { ProjectListView } from "./views/ProjectListView";
import { HooksView } from "./views/HooksView";

const VIEW_TO_PATH: Record<ViewType, string> = {
  welcome: "/",
  commit: "/commit",
  history: "/history",
  branches: "/branches",
  diff: "/diff",
  "diff-side-by-side": "/diff?mode=side-by-side",
  stash: "/stash",
  tags: "/tags",
  graph: "/graph",
  detail: "/detail",
  "file-search": "/file-search",
  "file-history": "/file-history",
  blame: "/blame",
  reflog: "/reflog",
  settings: "/settings",
  projects: "/projects",
  hooks: "/hooks",
};

const PATH_TO_VIEW: Record<string, ViewType> = {};
for (const [view, path] of Object.entries(VIEW_TO_PATH)) {
  const base = path.split("?")[0];
  if (!(base in PATH_TO_VIEW)) {
    PATH_TO_VIEW[base] = view as ViewType;
  }
}

export function viewToPath(view: ViewType): string {
  return VIEW_TO_PATH[view] || "/";
}

export function pathToView(pathname: string): ViewType {
  return PATH_TO_VIEW[pathname] || "welcome";
}

export const appRoutes = [
  { path: "/", element: <WelcomeView /> },
  { path: "/commit", element: <CommitView /> },
  { path: "/history", element: <HistoryView /> },
  { path: "/branches", element: <BranchesView /> },
  { path: "/diff", element: <DiffView /> },
  { path: "/stash", element: <StashView /> },
  { path: "/tags", element: <TagsView /> },
  { path: "/graph", element: <GraphView /> },
  { path: "/detail/:hash?", element: <CommitDetailView /> },
  { path: "/file-search", element: <FileSearchView /> },
  { path: "/file-history/:path?", element: <FileHistoryView /> },
  { path: "/blame/:path?", element: <BlameView /> },
  { path: "/reflog", element: <ReflogView /> },
  { path: "/settings", element: <SettingsView /> },
  { path: "/projects", element: <ProjectListView /> },
  { path: "/hooks", element: <HooksView /> },
];
