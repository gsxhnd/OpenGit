import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'

// Expose a safe API to the renderer process
const api = {
  // Repository
  openRepo: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.REPO_OPEN, path),
  closeRepo: () => ipcRenderer.invoke(IPC_CHANNELS.REPO_CLOSE),
  getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.REPO_GET_STATUS),

  // History
  getHistory: (count?: number, skip?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_HISTORY, count, skip),
  getCommit: (hash: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_COMMIT, hash),
  getCommitDiff: (hash: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_COMMIT_DIFF, hash),
  getBranchCommits: (branch: string, count?: number, skip?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_BRANCH_COMMITS, branch, count, skip),

  // Diff
  getFileDiff: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_FILE_DIFF, path),
  getStagedFileDiff: (path: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_STAGED_FILE_DIFF, path),
  getAllStagedDiff: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_ALL_STAGED_DIFF),

  // Staging & Commit
  stageFiles: (paths: string[]) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE_FILES, paths),
  unstageFiles: (paths: string[]) => ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE_FILES, paths),
  stageHunk: (filePath: string, hunkIndex: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE_HUNK, filePath, hunkIndex),
  unstageHunk: (filePath: string, hunkIndex: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE_HUNK, filePath, hunkIndex),
  discardChanges: (paths: string[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_DISCARD_CHANGES, paths),
  commit: (message: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, message),
  amendCommit: (message: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_AMEND_COMMIT, message),

  // Branches
  getBranches: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_BRANCHES),
  createBranch: (name: string, target?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_CREATE_BRANCH, name, target),
  deleteBranch: (name: string, force?: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_DELETE_BRANCH, name, force),
  switchBranch: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_SWITCH_BRANCH, name),

  // Remotes
  getRemotes: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_REMOTES),
  addRemote: (name: string, url: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_ADD_REMOTE, name, url),
  removeRemote: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_REMOVE_REMOTE, name),
  fetch: (remote?: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_FETCH, remote),
  pull: (remote?: string, branch?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_PULL, remote, branch),
  push: (remote?: string, branch?: string, force?: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_PUSH, remote, branch, force),

  // Tags
  getTags: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_TAGS),
  createTag: (name: string, target?: string, message?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_CREATE_TAG, name, target, message),
  deleteTag: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_DELETE_TAG, name),

  // Stash
  getStashes: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_STASHES),
  createStash: (message?: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_CREATE_STASH, message),
  applyStash: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_APPLY_STASH, id),
  popStash: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_POP_STASH, id),
  deleteStash: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_DELETE_STASH, id),

  // Merge
  merge: (branch: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_MERGE, branch),
  abortMerge: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_ABORT_MERGE),
  getConflictFiles: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_CONFLICT_FILES),
  resolveConflict: (filePath: string, resolution: 'ours' | 'theirs') =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_RESOLVE_CONFLICT, filePath, resolution),

  // Advanced
  revertCommit: (hash: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_REVERT_COMMIT, hash),
  reset: (target: string, mode?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_RESET, target, mode),
  rebase: (target: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_REBASE, target),
  rebaseContinue: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_REBASE_CONTINUE),
  rebaseAbort: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_REBASE_ABORT),
  cherryPick: (hash: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_CHERRY_PICK, hash),
  getGraph: (count?: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_GRAPH, count),
  filterHistoryByAuthor: (author: string, count?: number, skip?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_FILTER_HISTORY_BY_AUTHOR, author, count, skip),
  filterHistoryByFile: (path: string, count?: number, skip?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_FILTER_HISTORY_BY_FILE, path, count, skip),
  searchCommits: (query: string, count?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_SEARCH_COMMITS, query, count),
  searchFiles: (pattern: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_SEARCH_FILES, pattern),
  getFileHistory: (path: string, count?: number, skip?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_FILE_HISTORY, path, count, skip),
  getBlame: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_BLAME, path),
  getReflog: (count?: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_REFLOG, count),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  getThemes: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_THEMES),

  // Workspace
  addWorkspaceEntry: (entry: any) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_ADD_ENTRY, entry),
  removeWorkspaceEntry: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_REMOVE_ENTRY, path),
  updateWorkspaceEntry: (path: string, updates: any) =>
    ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_UPDATE_ENTRY, path, updates),
  reorderWorkspaceEntries: (entries: any[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_REORDER_ENTRIES, entries),
  setActiveWorkspace: (index: number) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_SET_ACTIVE, index),
  addWorkspaceGroup: (group: any) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_ADD_GROUP, group),
  removeWorkspaceGroup: (groupId: string) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_REMOVE_GROUP, groupId),

  // Window
  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),

  // Dialog
  openDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),

  // Events
  onRepoChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on(IPC_CHANNELS.REPO_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.REPO_CHANGED, handler)
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
