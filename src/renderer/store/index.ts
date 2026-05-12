/**
 * Zustand Store - 全局状态管理
 *
 * 采用单一 store 模式管理所有应用状态和操作。
 * 按功能领域划分为以下模块：
 *
 * 状态模块：
 * - Repository: 仓库路径、状态、加载状态
 * - Navigation: 当前视图、历史视图（用于返回）
 * - History: 提交历史、搜索、筛选
 * - Diff: 差异预览、视图模式（unified/side-by-side）
 * - Commit Detail: 选中的提交详情和 diff
 * - Stash/Tags: 暂存区和标签列表
 * - Graph: 提交图数据
 * - File Search/History/Blame: 文件级操作数据
 * - Reflog: HEAD 操作历史
 * - Merge/Conflict: 合并状态和冲突文件
 * - Toast: 通知消息队列
 * - Settings: 应用配置
 * - Workspace: 多项目工作区
 *
 * 操作模块：
 * - 所有操作都是 async 函数，内部调用 window.api.* (preload bridge)
 * - 操作完成后自动刷新相关状态
 * - 错误通过 toast 通知用户
 *
 * 设计决策：
 * - 使用单一 store 而非多个 store，简化跨模块状态访问
 * - 所有 API 调用集中在 store actions 中，视图层保持纯展示
 * - Toast 通知统一在 action 中触发，确保一致的用户反馈
 */
import { create } from 'zustand'
import type {
  RepositoryStatus,
  Commit,
  FileDiff,
  Stash,
  Tag,
  Branch,
  Remote,
  Toast,
  ToastKind,
  ViewType,
  BlameLine,
  ReflogEntry,
  GraphData,
  AppSettings,
  WorkspaceEntry,
  WorkspaceGroup,
  WorkspaceConfig,
} from '@shared/types'
import type { Language } from '../i18n/translations'

interface AppState {
  // Repository
  repoPath: string | null
  repoStatus: RepositoryStatus | null
  isLoading: boolean
  error: string | null

  // Navigation
  currentView: ViewType
  previousView: ViewType | null

  // History
  historyCommits: Commit[]
  historySkip: number
  selectedHistoryIndex: number | null
  searchQuery: string
  searchResults: Commit[]
  isSearching: boolean

  // Filters
  historyFilterBranch: string | null
  historyFilterAuthor: string | null
  historyFilterFile: string | null

  // Diff
  diffPreview: FileDiff | null
  selectedDiffPath: string | null
  selectedStagedDiffPath: string | null
  diffViewMode: 'unified' | 'side-by-side'

  // Commit detail
  selectedCommitDetail: Commit | null
  selectedCommitDiff: FileDiff[]

  // Stash
  stashList: Stash[]

  // Tags
  tagList: Tag[]

  // Graph
  graphData: GraphData | null

  // File search
  fileSearchResults: string[]

  // File history
  fileHistoryPath: string | null
  fileHistoryCommits: Commit[]

  // Blame
  blameData: BlameLine[]
  blamePath: string | null

  // Reflog
  reflogEntries: ReflogEntry[]

  // Commit form
  commitAmend: boolean

  // Merge/Conflict
  isMerging: boolean
  conflictFiles: string[]

  // Toasts
  toasts: Toast[]

  // Settings
  settings: AppSettings | null
  language: Language

  // Workspace
  workspaceConfig: WorkspaceConfig | null

  // Actions
  openRepo: (path: string) => Promise<void>
  closeRepo: () => Promise<void>
  refreshStatus: () => Promise<void>
  setView: (view: ViewType) => void
  goBack: () => void

  // Staging
  stageFiles: (paths: string[]) => Promise<void>
  unstageFiles: (paths: string[]) => Promise<void>
  stageHunk: (filePath: string, hunkIndex: number) => Promise<void>
  unstageHunk: (filePath: string, hunkIndex: number) => Promise<void>
  stageAll: () => Promise<void>
  unstageAll: () => Promise<void>
  discardChanges: (paths: string[]) => Promise<void>

  // Commit
  doCommit: (message: string) => Promise<void>
  doAmendCommit: (message: string) => Promise<void>
  setCommitAmend: (amend: boolean) => void

  // History
  loadHistory: (count?: number, skip?: number) => Promise<void>
  loadMoreHistory: () => Promise<void>
  searchCommits: (query: string) => Promise<void>
  clearSearch: () => void
  filterByAuthor: (author: string) => Promise<void>
  filterByFile: (path: string) => Promise<void>
  clearFilters: () => void

  // Diff
  loadFileDiff: (path: string) => Promise<void>
  loadStagedFileDiff: (path: string) => Promise<void>
  loadCommitDetail: (hash: string) => Promise<void>
  setDiffViewMode: (mode: 'unified' | 'side-by-side') => void

  // Branches
  createBranch: (name: string, target?: string) => Promise<void>
  deleteBranch: (name: string, force?: boolean) => Promise<void>
  switchBranch: (name: string) => Promise<void>

  // Remotes
  addRemote: (name: string, url: string) => Promise<void>
  removeRemote: (name: string) => Promise<void>
  doFetch: (remote?: string) => Promise<void>
  doPull: (remote?: string, branch?: string) => Promise<void>
  doPush: (remote?: string, branch?: string, force?: boolean) => Promise<void>

  // Tags
  loadTags: () => Promise<void>
  createTag: (name: string, target?: string, message?: string) => Promise<void>
  deleteTag: (name: string) => Promise<void>

  // Stash
  loadStashes: () => Promise<void>
  createStash: (message?: string) => Promise<void>
  applyStash: (id: number) => Promise<void>
  popStash: (id: number) => Promise<void>
  deleteStash: (id: number) => Promise<void>

  // Merge
  doMerge: (branch: string) => Promise<void>
  abortMerge: () => Promise<void>
  resolveConflict: (filePath: string, resolution: 'ours' | 'theirs') => Promise<void>
  loadConflictFiles: () => Promise<void>

  // Advanced
  revertCommit: (hash: string) => Promise<void>
  doReset: (target: string, mode?: string) => Promise<void>
  doRebase: (target: string) => Promise<void>
  rebaseContinue: () => Promise<void>
  rebaseAbort: () => Promise<void>
  doCherryPick: (hash: string) => Promise<void>
  loadGraph: (count?: number) => Promise<void>
  searchFiles: (pattern: string) => Promise<void>
  loadFileHistory: (path: string) => Promise<void>
  loadBlame: (path: string) => Promise<void>
  loadReflog: () => Promise<void>

  // Toast
  addToast: (message: string, kind: ToastKind) => void
  removeToast: (id: string) => void

  // Settings
  loadSettings: () => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>
  setLanguage: (language: Language) => Promise<void>

  // Workspace
  addWorkspaceEntry: (entry: WorkspaceEntry) => Promise<void>
  removeWorkspaceEntry: (path: string) => Promise<void>
  updateWorkspaceEntry: (path: string, updates: Partial<WorkspaceEntry>) => Promise<void>
  reorderWorkspaceEntries: (entries: WorkspaceEntry[]) => Promise<void>
  switchWorkspace: (index: number) => Promise<void>
  addWorkspaceGroup: (group: WorkspaceGroup) => Promise<void>
  removeWorkspaceGroup: (groupId: string) => Promise<void>
}

let toastCounter = 0

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  repoPath: null,
  repoStatus: null,
  isLoading: false,
  error: null,
  currentView: 'welcome',
  previousView: null,
  historyCommits: [],
  historySkip: 0,
  selectedHistoryIndex: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  historyFilterBranch: null,
  historyFilterAuthor: null,
  historyFilterFile: null,
  diffPreview: null,
  selectedDiffPath: null,
  selectedStagedDiffPath: null,
  diffViewMode: 'unified',
  selectedCommitDetail: null,
  selectedCommitDiff: [],
  stashList: [],
  tagList: [],
  graphData: null,
  fileSearchResults: [],
  fileHistoryPath: null,
  fileHistoryCommits: [],
  blameData: [],
  blamePath: null,
  reflogEntries: [],
  commitAmend: false,
  isMerging: false,
  conflictFiles: [],
  toasts: [],
  settings: null,
  language: 'en',
  workspaceConfig: null,

  // Actions
  openRepo: async (path) => {
    set({ isLoading: true, error: null })
    try {
      const status = await window.api.openRepo(path)
      set({
        repoPath: path,
        repoStatus: status,
        isLoading: false,
        currentView: 'commit',
      })
      get().addToast('Repository opened', 'success')
    } catch (err: any) {
      set({ isLoading: false, error: err.message })
      get().addToast(err.message, 'error')
    }
  },

  closeRepo: async () => {
    await window.api.closeRepo()
    set({
      repoPath: null,
      repoStatus: null,
      currentView: 'welcome',
      historyCommits: [],
      diffPreview: null,
      stashList: [],
      tagList: [],
      graphData: null,
    })
  },

  refreshStatus: async () => {
    try {
      const status = await window.api.getStatus()
      set({ repoStatus: status })
    } catch (err: any) {
      get().addToast(`Refresh failed: ${err.message}`, 'error')
    }
  },

  setView: (view) => {
    const current = get().currentView
    set({ currentView: view, previousView: current })
  },

  goBack: () => {
    const prev = get().previousView
    if (prev) set({ currentView: prev, previousView: null })
  },

  // Staging
  stageFiles: async (paths) => {
    try {
      await window.api.stageFiles(paths)
      await get().refreshStatus()
    } catch (err: any) {
      get().addToast(`Stage failed: ${err.message}`, 'error')
    }
  },

  unstageFiles: async (paths) => {
    try {
      await window.api.unstageFiles(paths)
      await get().refreshStatus()
    } catch (err: any) {
      get().addToast(`Unstage failed: ${err.message}`, 'error')
    }
  },

  stageHunk: async (filePath, hunkIndex) => {
    try {
      await window.api.stageHunk(filePath, hunkIndex)
      await get().refreshStatus()
      get().addToast('Hunk staged', 'success')
    } catch (err: any) {
      get().addToast(`Stage hunk failed: ${err.message}`, 'error')
    }
  },

  unstageHunk: async (filePath, hunkIndex) => {
    try {
      await window.api.unstageHunk(filePath, hunkIndex)
      await get().refreshStatus()
      get().addToast('Hunk unstaged', 'success')
    } catch (err: any) {
      get().addToast(`Unstage hunk failed: ${err.message}`, 'error')
    }
  },

  stageAll: async () => {
    const status = get().repoStatus?.status
    if (!status) return
    const allPaths = [
      ...status.unstagedFiles.map((f) => f.path),
      ...status.untrackedFiles.map((f) => f.path),
    ]
    if (allPaths.length > 0) {
      await get().stageFiles(allPaths)
    }
  },

  unstageAll: async () => {
    const status = get().repoStatus?.status
    if (!status) return
    const allPaths = status.stagedFiles.map((f) => f.path)
    if (allPaths.length > 0) {
      await get().unstageFiles(allPaths)
    }
  },

  discardChanges: async (paths) => {
    try {
      await window.api.discardChanges(paths)
      await get().refreshStatus()
      get().addToast('Changes discarded', 'info')
    } catch (err: any) {
      get().addToast(`Discard failed: ${err.message}`, 'error')
    }
  },

  // Commit
  doCommit: async (message) => {
    try {
      await window.api.commit(message)
      await get().refreshStatus()
      get().addToast('Committed successfully', 'success')
    } catch (err: any) {
      get().addToast(`Commit failed: ${err.message}`, 'error')
    }
  },

  doAmendCommit: async (message) => {
    try {
      await window.api.amendCommit(message)
      await get().refreshStatus()
      set({ commitAmend: false })
      get().addToast('Commit amended', 'success')
    } catch (err: any) {
      get().addToast(`Amend failed: ${err.message}`, 'error')
    }
  },

  setCommitAmend: (amend) => set({ commitAmend: amend }),

  // History
  loadHistory: async (count = 50, skip = 0) => {
    try {
      const commits = await window.api.getHistory(count, skip)
      set({ historyCommits: commits, historySkip: skip })
    } catch (err: any) {
      get().addToast(`Load history failed: ${err.message}`, 'error')
    }
  },

  loadMoreHistory: async () => {
    const { historySkip, historyCommits } = get()
    try {
      const newSkip = historySkip + 50
      const more = await window.api.getHistory(50, newSkip)
      set({ historyCommits: [...historyCommits, ...more], historySkip: newSkip })
    } catch (err: any) {
      get().addToast(`Load more failed: ${err.message}`, 'error')
    }
  },

  searchCommits: async (query) => {
    set({ isSearching: true, searchQuery: query })
    try {
      const results = await window.api.searchCommits(query)
      set({ searchResults: results, isSearching: false })
    } catch (err: any) {
      set({ isSearching: false })
      get().addToast(`Search failed: ${err.message}`, 'error')
    }
  },

  clearSearch: () => set({ searchQuery: '', searchResults: [], isSearching: false }),

  filterByAuthor: async (author) => {
    set({ historyFilterAuthor: author })
    try {
      const commits = await window.api.filterHistoryByAuthor(author)
      set({ historyCommits: commits })
    } catch (err: any) {
      get().addToast(`Filter failed: ${err.message}`, 'error')
    }
  },

  filterByFile: async (path) => {
    set({ historyFilterFile: path })
    try {
      const commits = await window.api.filterHistoryByFile(path)
      set({ historyCommits: commits })
    } catch (err: any) {
      get().addToast(`Filter failed: ${err.message}`, 'error')
    }
  },

  clearFilters: () => {
    set({
      historyFilterBranch: null,
      historyFilterAuthor: null,
      historyFilterFile: null,
    })
    get().loadHistory()
  },

  // Diff
  loadFileDiff: async (path) => {
    try {
      const diff = await window.api.getFileDiff(path)
      set({ diffPreview: diff, selectedDiffPath: path })
    } catch (err: any) {
      get().addToast(`Diff failed: ${err.message}`, 'error')
    }
  },

  loadStagedFileDiff: async (path) => {
    try {
      const diff = await window.api.getStagedFileDiff(path)
      set({ diffPreview: diff, selectedStagedDiffPath: path })
    } catch (err: any) {
      get().addToast(`Diff failed: ${err.message}`, 'error')
    }
  },

  loadCommitDetail: async (hash) => {
    try {
      const [commit, diffs] = await Promise.all([
        window.api.getCommit(hash),
        window.api.getCommitDiff(hash),
      ])
      set({
        selectedCommitDetail: commit,
        selectedCommitDiff: diffs,
        currentView: 'detail',
        previousView: get().currentView,
      })
    } catch (err: any) {
      get().addToast(`Load commit failed: ${err.message}`, 'error')
    }
  },

  setDiffViewMode: (mode) => {
    set({ diffViewMode: mode })
  },

  // Branches
  createBranch: async (name, target) => {
    try {
      await window.api.createBranch(name, target)
      await get().refreshStatus()
      get().addToast(`Branch '${name}' created`, 'success')
    } catch (err: any) {
      get().addToast(`Create branch failed: ${err.message}`, 'error')
    }
  },

  deleteBranch: async (name, force) => {
    try {
      await window.api.deleteBranch(name, force)
      await get().refreshStatus()
      get().addToast(`Branch '${name}' deleted`, 'success')
    } catch (err: any) {
      get().addToast(`Delete branch failed: ${err.message}`, 'error')
    }
  },

  switchBranch: async (name) => {
    try {
      await window.api.switchBranch(name)
      await get().refreshStatus()
      get().addToast(`Switched to '${name}'`, 'success')
    } catch (err: any) {
      get().addToast(`Switch failed: ${err.message}`, 'error')
    }
  },

  // Remotes
  addRemote: async (name, url) => {
    try {
      await window.api.addRemote(name, url)
      await get().refreshStatus()
      get().addToast(`Remote '${name}' added`, 'success')
    } catch (err: any) {
      get().addToast(`Add remote failed: ${err.message}`, 'error')
    }
  },

  removeRemote: async (name) => {
    try {
      await window.api.removeRemote(name)
      await get().refreshStatus()
      get().addToast(`Remote '${name}' removed`, 'success')
    } catch (err: any) {
      get().addToast(`Remove remote failed: ${err.message}`, 'error')
    }
  },

  doFetch: async (remote) => {
    try {
      await window.api.fetch(remote)
      await get().refreshStatus()
      get().addToast('Fetch complete', 'success')
    } catch (err: any) {
      get().addToast(`Fetch failed: ${err.message}`, 'error')
    }
  },

  doPull: async (remote, branch) => {
    try {
      await window.api.pull(remote, branch)
      await get().refreshStatus()
      get().addToast('Pull complete', 'success')
    } catch (err: any) {
      get().addToast(`Pull failed: ${err.message}`, 'error')
    }
  },

  doPush: async (remote, branch, force) => {
    try {
      await window.api.push(remote, branch, force)
      await get().refreshStatus()
      get().addToast('Push complete', 'success')
    } catch (err: any) {
      get().addToast(`Push failed: ${err.message}`, 'error')
    }
  },

  // Tags
  loadTags: async () => {
    try {
      const tags = await window.api.getTags()
      set({ tagList: tags })
    } catch (err: any) {
      get().addToast(`Load tags failed: ${err.message}`, 'error')
    }
  },

  createTag: async (name, target, message) => {
    try {
      await window.api.createTag(name, target, message)
      await get().loadTags()
      get().addToast(`Tag '${name}' created`, 'success')
    } catch (err: any) {
      get().addToast(`Create tag failed: ${err.message}`, 'error')
    }
  },

  deleteTag: async (name) => {
    try {
      await window.api.deleteTag(name)
      await get().loadTags()
      get().addToast(`Tag '${name}' deleted`, 'success')
    } catch (err: any) {
      get().addToast(`Delete tag failed: ${err.message}`, 'error')
    }
  },

  // Stash
  loadStashes: async () => {
    try {
      const stashes = await window.api.getStashes()
      set({ stashList: stashes })
    } catch (err: any) {
      get().addToast(`Load stashes failed: ${err.message}`, 'error')
    }
  },

  createStash: async (message) => {
    try {
      await window.api.createStash(message)
      await get().loadStashes()
      await get().refreshStatus()
      get().addToast('Stash created', 'success')
    } catch (err: any) {
      get().addToast(`Create stash failed: ${err.message}`, 'error')
    }
  },

  applyStash: async (id) => {
    try {
      await window.api.applyStash(id)
      await get().refreshStatus()
      get().addToast('Stash applied', 'success')
    } catch (err: any) {
      get().addToast(`Apply stash failed: ${err.message}`, 'error')
    }
  },

  popStash: async (id) => {
    try {
      await window.api.popStash(id)
      await get().loadStashes()
      await get().refreshStatus()
      get().addToast('Stash popped', 'success')
    } catch (err: any) {
      get().addToast(`Pop stash failed: ${err.message}`, 'error')
    }
  },

  deleteStash: async (id) => {
    try {
      await window.api.deleteStash(id)
      await get().loadStashes()
      get().addToast('Stash deleted', 'success')
    } catch (err: any) {
      get().addToast(`Delete stash failed: ${err.message}`, 'error')
    }
  },

  // Merge
  doMerge: async (branch) => {
    try {
      await window.api.merge(branch)
      await get().refreshStatus()
      get().addToast(`Merged '${branch}'`, 'success')
    } catch (err: any) {
      get().addToast(`Merge failed: ${err.message}`, 'error')
    }
  },

  abortMerge: async () => {
    try {
      await window.api.abortMerge()
      await get().refreshStatus()
      set({ isMerging: false, conflictFiles: [] })
      get().addToast('Merge aborted', 'info')
    } catch (err: any) {
      get().addToast(`Abort merge failed: ${err.message}`, 'error')
    }
  },

  loadConflictFiles: async () => {
    try {
      const files = await window.api.getConflictFiles()
      set({ conflictFiles: files.map((f: any) => f.path), isMerging: files.length > 0 })
    } catch (err: any) {
      get().addToast(`Load conflicts failed: ${err.message}`, 'error')
    }
  },

  resolveConflict: async (filePath, resolution) => {
    try {
      await window.api.resolveConflict(filePath, resolution)
      await get().refreshStatus()
      await get().loadConflictFiles()
      get().addToast(`Conflict resolved with '${resolution}'`, 'success')
    } catch (err: any) {
      get().addToast(`Resolve conflict failed: ${err.message}`, 'error')
    }
  },

  // Advanced
  revertCommit: async (hash) => {
    try {
      await window.api.revertCommit(hash)
      await get().refreshStatus()
      get().addToast('Commit reverted', 'success')
    } catch (err: any) {
      get().addToast(`Revert failed: ${err.message}`, 'error')
    }
  },

  doReset: async (target, mode) => {
    try {
      await window.api.reset(target, mode)
      await get().refreshStatus()
      get().addToast(`Reset to ${target.slice(0, 7)}`, 'success')
    } catch (err: any) {
      get().addToast(`Reset failed: ${err.message}`, 'error')
    }
  },

  doRebase: async (target) => {
    try {
      await window.api.rebase(target)
      await get().refreshStatus()
      get().addToast(`Rebasing onto ${target}`, 'success')
    } catch (err: any) {
      get().addToast(`Rebase failed: ${err.message}`, 'error')
    }
  },

  rebaseContinue: async () => {
    try {
      await window.api.rebaseContinue()
      await get().refreshStatus()
      get().addToast('Rebase continued', 'success')
    } catch (err: any) {
      get().addToast(`Rebase continue failed: ${err.message}`, 'error')
    }
  },

  rebaseAbort: async () => {
    try {
      await window.api.rebaseAbort()
      await get().refreshStatus()
      get().addToast('Rebase aborted', 'info')
    } catch (err: any) {
      get().addToast(`Rebase abort failed: ${err.message}`, 'error')
    }
  },

  doCherryPick: async (hash) => {
    try {
      await window.api.cherryPick(hash)
      await get().refreshStatus()
      get().addToast(`Cherry-picked ${hash.slice(0, 7)}`, 'success')
    } catch (err: any) {
      get().addToast(`Cherry-pick failed: ${err.message}`, 'error')
    }
  },

  loadGraph: async (count) => {
    try {
      const data = await window.api.getGraph(count)
      set({ graphData: data })
    } catch (err: any) {
      get().addToast(`Load graph failed: ${err.message}`, 'error')
    }
  },

  searchFiles: async (pattern) => {
    try {
      const results = await window.api.searchFiles(pattern)
      set({ fileSearchResults: results })
    } catch (err: any) {
      get().addToast(`File search failed: ${err.message}`, 'error')
    }
  },

  loadFileHistory: async (path) => {
    try {
      const commits = await window.api.getFileHistory(path)
      set({
        fileHistoryPath: path,
        fileHistoryCommits: commits,
        currentView: 'file-history',
        previousView: get().currentView,
      })
    } catch (err: any) {
      get().addToast(`File history failed: ${err.message}`, 'error')
    }
  },

  loadBlame: async (path) => {
    try {
      const data = await window.api.getBlame(path)
      set({
        blameData: data,
        blamePath: path,
        currentView: 'blame',
        previousView: get().currentView,
      })
    } catch (err: any) {
      get().addToast(`Blame failed: ${err.message}`, 'error')
    }
  },

  loadReflog: async () => {
    try {
      const entries = await window.api.getReflog()
      set({ reflogEntries: entries })
    } catch (err: any) {
      get().addToast(`Reflog failed: ${err.message}`, 'error')
    }
  },

  // Toast
  addToast: (message, kind) => {
    const id = `toast-${++toastCounter}`
    const toast: Toast = { id, message, kind, createdAt: Date.now() }
    set((state) => ({
      toasts: [...state.toasts.slice(-4), toast], // Max 5
    }))
    // Auto-expire after 5s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 5000)
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  // Settings
  loadSettings: async () => {
    const settings = await window.api.getSettings()
    set({ settings, workspaceConfig: settings.workspace, language: (settings.language as Language) || 'en' })
  },

  updateSettings: async (partial) => {
    const updated = await window.api.setSettings(partial)
    set({ settings: updated, workspaceConfig: updated.workspace })
  },

  setLanguage: async (language) => {
    const settings = get().settings
    if (settings) {
      await get().updateSettings({ ...settings, language })
      set({ language })
    }
  },

  addWorkspaceEntry: async (entry) => {
    try {
      const workspace = await window.api.addWorkspaceEntry(entry)
      set({ workspaceConfig: workspace })
      get().addToast(`Added project '${entry.name}'`, 'success')
    } catch (err: any) {
      get().addToast(`Add project failed: ${err.message}`, 'error')
    }
  },

  removeWorkspaceEntry: async (path) => {
    try {
      const workspace = await window.api.removeWorkspaceEntry(path)
      set({ workspaceConfig: workspace })
      get().addToast('Project removed', 'success')
    } catch (err: any) {
      get().addToast(`Remove project failed: ${err.message}`, 'error')
    }
  },

  updateWorkspaceEntry: async (path, updates) => {
    try {
      const workspace = await window.api.updateWorkspaceEntry(path, updates)
      set({ workspaceConfig: workspace })
      get().addToast('Project updated', 'success')
    } catch (err: any) {
      get().addToast(`Update project failed: ${err.message}`, 'error')
    }
  },

  reorderWorkspaceEntries: async (entries) => {
    try {
      const workspace = await window.api.reorderWorkspaceEntries(entries)
      set({ workspaceConfig: workspace })
    } catch (err: any) {
      get().addToast(`Reorder failed: ${err.message}`, 'error')
    }
  },

  switchWorkspace: async (index) => {
    try {
      const workspace = await window.api.setActiveWorkspace(index)
      set({ workspaceConfig: workspace })
      const entry = workspace.entries[index]
      if (entry) {
        await get().openRepo(entry.path)
      }
    } catch (err: any) {
      get().addToast(`Switch workspace failed: ${err.message}`, 'error')
    }
  },

  addWorkspaceGroup: async (group) => {
    try {
      const workspace = await window.api.addWorkspaceGroup(group)
      set({ workspaceConfig: workspace })
      get().addToast(`Group '${group.name}' created`, 'success')
    } catch (err: any) {
      get().addToast(`Create group failed: ${err.message}`, 'error')
    }
  },

  removeWorkspaceGroup: async (groupId) => {
    try {
      const workspace = await window.api.removeWorkspaceGroup(groupId)
      set({ workspaceConfig: workspace })
      get().addToast('Group removed', 'success')
    } catch (err: any) {
      get().addToast(`Remove group failed: ${err.message}`, 'error')
    }
  },
}))
