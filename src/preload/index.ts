/**
 * Preload 脚本 - 安全的 IPC 桥接层
 *
 * 通过 contextBridge 将主进程的 IPC 能力安全地暴露给渲染进程。
 * 所有 API 方法都是类型安全的，渲染进程通过 window.api.* 调用。
 *
 * 安全原则：
 * - 仅暴露必要的 IPC 通道
 * - 使用 invoke（请求-响应）模式，而非直接暴露 ipcRenderer
 * - 事件监听使用 on/removeListener 模式，返回取消订阅函数
 */
import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'

// 暴露给渲染进程的安全 API
const api = {
  // ============ 仓库管理 ============
  openRepo: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.REPO_OPEN, path),
  closeRepo: () => ipcRenderer.invoke(IPC_CHANNELS.REPO_CLOSE),
  getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.REPO_GET_STATUS),

  // ============ 历史记录 ============
  getHistory: (count?: number, skip?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_HISTORY, count, skip),
  getCommit: (hash: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_COMMIT, hash),
  getCommitDiff: (hash: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_COMMIT_DIFF, hash),
  getBranchCommits: (branch: string, count?: number, skip?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_BRANCH_COMMITS, branch, count, skip),

  // ============ Diff 差异 ============
  getFileDiff: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_FILE_DIFF, path),
  getStagedFileDiff: (path: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_STAGED_FILE_DIFF, path),
  getAllStagedDiff: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_ALL_STAGED_DIFF),

  // ============ 暂存与提交 ============
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

  // ============ 分支管理 ============
  getBranches: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_BRANCHES),
  createBranch: (name: string, target?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_CREATE_BRANCH, name, target),
  deleteBranch: (name: string, force?: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_DELETE_BRANCH, name, force),
  switchBranch: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_SWITCH_BRANCH, name),

  // ============ 远程仓库 ============
  getRemotes: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_REMOTES),
  addRemote: (name: string, url: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_ADD_REMOTE, name, url),
  removeRemote: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_REMOVE_REMOTE, name),
  fetch: (remote?: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_FETCH, remote),
  pull: (remote?: string, branch?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_PULL, remote, branch),
  push: (remote?: string, branch?: string, force?: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_PUSH, remote, branch, force),

  // ============ 标签管理 ============
  getTags: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_TAGS),
  createTag: (name: string, target?: string, message?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_CREATE_TAG, name, target, message),
  deleteTag: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_DELETE_TAG, name),

  // ============ Stash 暂存区 ============
  getStashes: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_STASHES),
  createStash: (message?: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_CREATE_STASH, message),
  applyStash: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_APPLY_STASH, id),
  popStash: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_POP_STASH, id),
  deleteStash: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_DELETE_STASH, id),

  // ============ 合并与冲突 ============
  merge: (branch: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_MERGE, branch),
  abortMerge: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_ABORT_MERGE),
  getConflictFiles: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_CONFLICT_FILES),
  resolveConflict: (filePath: string, resolution: 'ours' | 'theirs') =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_RESOLVE_CONFLICT, filePath, resolution),

  // ============ 高级 Git 操作 ============
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

  // ============ Git Hooks 管理 ============
  /** 获取所有 Hook 状态 */
  getHooks: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_HOOKS),
  /** 切换 Hook 启用/禁用 */
  toggleHook: (hookName: string, enable: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_TOGGLE_HOOK, hookName, enable),
  /** 保存 Hook 脚本 */
  saveHook: (hookName: string, content: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_SAVE_HOOK, hookName, content),
  /** 删除 Hook */
  deleteHook: (hookName: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_DELETE_HOOK, hookName),

  // ============ 设置与工作区 ============
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  getThemes: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_THEMES),

  // 工作区管理
  addWorkspaceEntry: (entry: any) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_ADD_ENTRY, entry),
  removeWorkspaceEntry: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_REMOVE_ENTRY, path),
  updateWorkspaceEntry: (path: string, updates: any) =>
    ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_UPDATE_ENTRY, path, updates),
  reorderWorkspaceEntries: (entries: any[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_REORDER_ENTRIES, entries),
  setActiveWorkspace: (index: number) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_SET_ACTIVE, index),
  addWorkspaceGroup: (group: any) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_ADD_GROUP, group),
  removeWorkspaceGroup: (groupId: string) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_REMOVE_GROUP, groupId),

  // ============ 窗口控制 ============
  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),

  // ============ 系统对话框 ============
  openDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),

  // ============ 事件监听 ============
  /** 监听仓库文件变更事件，返回取消订阅函数 */
  onRepoChanged: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on(IPC_CHANNELS.REPO_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.REPO_CHANGED, handler)
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
