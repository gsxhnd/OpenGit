/**
 * Shared Types - 跨进程共享类型定义
 *
 * 定义主进程和渲染进程之间共享的所有数据类型。
 * 这些类型用于 IPC 通信的参数和返回值，确保类型安全。
 *
 * 分类：
 * - Git Models: Git 对象的数据模型（Commit、Branch、Tag 等）
 * - Diff Models: 差异比较相关类型（FileDiff、DiffHunk、DiffLine）
 * - App Models: 应用层面的类型（Settings、Workspace、Toast、ViewType）
 */

// ============ Git Models - Git 对象模型 ============

export interface Commit {
  hash: string
  summary: string
  message: string
  author: string
  committer: string
  time: string // ISO 8601
  parents: string[]
}

export type FileStatus =
  | 'unmodified'
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'untracked'
  | 'conflicted'

export interface FileEntry {
  path: string
  status: FileStatus
  staged: boolean
  unstaged: boolean
}

export interface WorkingTreeStatus {
  unstagedFiles: FileEntry[]
  stagedFiles: FileEntry[]
  untrackedFiles: FileEntry[]
  currentBranch: string | null
  mergeHead: string | null
  rebaseMerge: boolean
}

export interface Branch {
  name: string
  target: string
  isLocal: boolean
  isHead: boolean
  upstream: string | null
}

export interface Remote {
  name: string
  fetchUrl: string
  pushUrl: string
}

export interface Tag {
  name: string
  target: string
  message: string | null
  tagger: string | null
}

export interface RepositoryStatus {
  status: WorkingTreeStatus
  head: Commit | null
  branches: Branch[]
  remotes: Remote[]
  tags: Tag[]
  ahead: number
  behind: number
}

export interface DiffLine {
  prefix: '+' | '-' | ' '
  content: string
  oldLine: number | null
  newLine: number | null
}

export interface DiffHunk {
  oldRange: { start: number; count: number }
  newRange: { start: number; count: number }
  header: string
  lines: DiffLine[]
}

export interface HunkIdentifier {
  filePath: string
  hunkIndex: number
}

export interface FileDiff {
  path: string
  oldPath: string | null
  status: FileStatus
  hunks: DiffHunk[]
  isBinary: boolean
}

export interface Stash {
  id: number
  description: string
  commit: string
}

export interface BlameLine {
  hash: string
  author: string
  time: string
  line: number
  content: string
  summary: string
}

export interface ReflogEntry {
  oldHash: string
  newHash: string
  committer: string
  time: string
  message: string
}

export type GraphCell = 'empty' | 'pipe' | 'branch' | 'merge' | 'dot' | 'fork' | 'merge_end'

export interface GraphRow {
  cells: GraphCell[]
  commit: Commit
  branchLabels: string[]
  tagLabels: string[]
}

export interface GraphData {
  rows: GraphRow[]
}

// ============ App Models ============

export type ResetMode = 'soft' | 'mixed' | 'hard'

export type ConflictResolution = 'ours' | 'theirs'

export interface ConflictFile {
  path: string
  status: 'conflicted'
}

export interface RepoEntry {
  path: string
  name: string
  lastOpened?: string
}

export interface WorkspaceGroup {
  id: string
  name: string
}

export interface WorkspaceEntry {
  path: string
  name: string
  groupId?: string
  lastOpened?: string
}

export interface WorkspaceConfig {
  entries: WorkspaceEntry[]
  groups: WorkspaceGroup[]
  activeIndex: number
}

export interface WindowConfig {
  width: number
  height: number
  x?: number
  y?: number
}

export interface AppSettings {
  window: WindowConfig
  recentRepos: RepoEntry[]
  theme: string
  language: string
  workspace: WorkspaceConfig
}

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  kind: ToastKind
  createdAt: number
}

export type ViewType =
  | 'commit'
  | 'history'
  | 'branches'
  | 'diff'
  | 'diff-side-by-side'
  | 'stash'
  | 'tags'
  | 'graph'
  | 'detail'
  | 'file-search'
  | 'file-history'
  | 'blame'
  | 'reflog'
  | 'settings'
  | 'projects'
  | 'hooks'
  | 'welcome'
