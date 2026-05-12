import { ipcMain, BrowserWindow } from 'electron'
import simpleGit, { SimpleGit, StatusResult, DiffResult } from 'simple-git'
import { IPC_CHANNELS } from '../shared/ipc'
import {
  RepositoryStatus,
  WorkingTreeStatus,
  FileEntry,
  FileStatus,
  Commit,
  Branch,
  Remote,
  Tag,
  FileDiff,
  DiffHunk,
  DiffLine,
  Stash,
  BlameLine,
  ReflogEntry,
  ResetMode,
} from '../shared/types'
import { setupFileWatcher, stopFileWatcher } from './file-watcher'

let git: SimpleGit | null = null
let currentRepoPath: string | null = null

function getGit(): SimpleGit {
  if (!git) throw new Error('No repository opened')
  return git
}

// ============ Helpers ============

function parseFileStatus(x: string, y: string): FileStatus {
  if (x === '?' || y === '?') return 'untracked'
  if (x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D'))
    return 'conflicted'
  if (x === 'A' || y === 'A') return 'added'
  if (x === 'D' || y === 'D') return 'deleted'
  if (x === 'R' || y === 'R') return 'renamed'
  if (x === 'M' || y === 'M') return 'modified'
  return 'unmodified'
}

async function getRepoStatus(): Promise<RepositoryStatus> {
  const g = getGit()

  const [status, logResult, branchSummary, remotesRaw, tagsResult] = await Promise.all([
    g.status(),
    g.log({ maxCount: 1 }).catch(() => null),
    g.branch(),
    g.getRemotes(true),
    g.tags(),
  ])

  // Parse working tree status
  const stagedFiles: FileEntry[] = status.staged.map((f) => ({
    path: f,
    status: 'modified' as FileStatus,
    staged: true,
    unstaged: false,
  }))

  const unstagedFiles: FileEntry[] = status.modified
    .filter((f) => !status.staged.includes(f))
    .map((f) => ({
      path: f,
      status: 'modified' as FileStatus,
      staged: false,
      unstaged: true,
    }))

  // Include deleted files
  status.deleted.forEach((f) => {
    if (status.staged.includes(f)) {
      stagedFiles.push({ path: f, status: 'deleted', staged: true, unstaged: false })
    } else {
      unstagedFiles.push({ path: f, status: 'deleted', staged: false, unstaged: true })
    }
  })

  // Renamed files
  status.renamed.forEach((r) => {
    stagedFiles.push({ path: r.to, status: 'renamed', staged: true, unstaged: false })
  })

  // Created (new staged files)
  status.created.forEach((f) => {
    if (status.staged.includes(f)) {
      stagedFiles.push({ path: f, status: 'added', staged: true, unstaged: false })
    }
  })

  const untrackedFiles: FileEntry[] = status.not_added.map((f) => ({
    path: f,
    status: 'untracked' as FileStatus,
    staged: false,
    unstaged: true,
  }))

  // Conflicted files
  status.conflicted.forEach((f) => {
    unstagedFiles.push({ path: f, status: 'conflicted', staged: false, unstaged: true })
  })

  const workingTree: WorkingTreeStatus = {
    unstagedFiles,
    stagedFiles,
    untrackedFiles,
    currentBranch: status.current || null,
    mergeHead: null, // TODO: detect merge state
    rebaseMerge: false,
  }

  // Head commit
  let head: Commit | null = null
  if (logResult && logResult.latest) {
    const l = logResult.latest
    head = {
      hash: l.hash,
      summary: l.message.split('\n')[0],
      message: l.message,
      author: `${l.author_name} <${l.author_email}>`,
      committer: `${l.author_name} <${l.author_email}>`,
      time: l.date,
      parents: [],
    }
  }

  // Branches
  const branches: Branch[] = Object.entries(branchSummary.branches).map(([name, info]) => ({
    name,
    target: info.commit,
    isLocal: !name.startsWith('remotes/'),
    isHead: info.current,
    upstream: null,
  }))

  // Remotes
  const remotes: Remote[] = remotesRaw.map((r) => ({
    name: r.name,
    fetchUrl: r.refs.fetch || '',
    pushUrl: r.refs.push || '',
  }))

  // Tags
  const tags: Tag[] = tagsResult.all.map((t) => ({
    name: t,
    target: '',
    message: null,
    tagger: null,
  }))

  // Ahead/behind
  const ahead = status.ahead || 0
  const behind = status.behind || 0

  return { status: workingTree, head, branches, remotes, tags, ahead, behind }
}

function parseDiffOutput(diffText: string, filePath: string): FileDiff {
  const hunks: DiffHunk[] = []
  const lines = diffText.split('\n')
  let currentHunk: DiffHunk | null = null

  for (const line of lines) {
    const hunkMatch = line.match(/^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@(.*)/)
    if (hunkMatch) {
      currentHunk = {
        oldRange: { start: parseInt(hunkMatch[1]), count: parseInt(hunkMatch[2] || '1') },
        newRange: { start: parseInt(hunkMatch[3]), count: parseInt(hunkMatch[4] || '1') },
        header: hunkMatch[5] || '',
        lines: [],
      }
      hunks.push(currentHunk)
      continue
    }

    if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
      const prefix = line[0] as '+' | '-' | ' '
      currentHunk.lines.push({
        prefix,
        content: line.slice(1),
        oldLine: prefix !== '+' ? null : null, // Line numbers computed by renderer
        newLine: prefix !== '-' ? null : null,
      })
    }
  }

  return {
    path: filePath,
    oldPath: null,
    status: 'modified',
    hunks,
    isBinary: diffText.includes('Binary files'),
  }
}

// ============ IPC Handlers ============

export function registerGitHandlers() {
  // Repository
  ipcMain.handle(IPC_CHANNELS.REPO_OPEN, async (_event, repoPath: string) => {
    git = simpleGit(repoPath)
    currentRepoPath = repoPath

    // Verify it's a git repo
    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
      git = null
      currentRepoPath = null
      throw new Error('Not a git repository')
    }

    // Setup file watcher
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      setupFileWatcher(repoPath, win)
    }

    return getRepoStatus()
  })

  ipcMain.handle(IPC_CHANNELS.REPO_CLOSE, async () => {
    stopFileWatcher()
    git = null
    currentRepoPath = null
  })

  ipcMain.handle(IPC_CHANNELS.REPO_GET_STATUS, async () => {
    return getRepoStatus()
  })

  // History
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_HISTORY,
    async (_event, count: number = 50, skip: number = 0) => {
      const g = getGit()
      const log = await g.log({ maxCount: count, '--skip': skip })
      return log.all.map((l) => ({
        hash: l.hash,
        summary: l.message.split('\n')[0],
        message: l.message,
        author: `${l.author_name} <${l.author_email}>`,
        committer: `${l.author_name} <${l.author_email}>`,
        time: l.date,
        parents: l.refs ? l.refs.split(', ') : [],
      }))
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_GET_COMMIT, async (_event, hash: string) => {
    const g = getGit()
    const log = await g.log({ maxCount: 1, from: hash, to: hash })
    if (!log.latest) throw new Error('Commit not found')
    const l = log.latest
    return {
      hash: l.hash,
      summary: l.message.split('\n')[0],
      message: l.message,
      author: `${l.author_name} <${l.author_email}>`,
      committer: `${l.author_name} <${l.author_email}>`,
      time: l.date,
      parents: [],
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_GET_COMMIT_DIFF, async (_event, hash: string) => {
    const g = getGit()
    const diff = await g.diff([`${hash}~1`, hash])
    // Parse multi-file diff
    const files: FileDiff[] = []
    const fileSections = diff.split(/^diff --git/m).filter(Boolean)
    for (const section of fileSections) {
      const pathMatch = section.match(/a\/(.+?)\s+b\/(.+)/)
      if (pathMatch) {
        files.push(parseDiffOutput(section, pathMatch[2]))
      }
    }
    return files
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_BRANCH_COMMITS,
    async (_event, branch: string, count: number = 50, skip: number = 0) => {
      const g = getGit()
      const log = await g.log({ maxCount: count, '--skip': skip, [branch]: null })
      return log.all.map((l) => ({
        hash: l.hash,
        summary: l.message.split('\n')[0],
        message: l.message,
        author: `${l.author_name} <${l.author_email}>`,
        committer: `${l.author_name} <${l.author_email}>`,
        time: l.date,
        parents: [],
      }))
    }
  )

  // Diff
  ipcMain.handle(IPC_CHANNELS.GIT_GET_FILE_DIFF, async (_event, filePath: string) => {
    const g = getGit()
    const diff = await g.diff([filePath])
    return parseDiffOutput(diff, filePath)
  })

  ipcMain.handle(IPC_CHANNELS.GIT_GET_STAGED_FILE_DIFF, async (_event, filePath: string) => {
    const g = getGit()
    const diff = await g.diff(['--cached', filePath])
    return parseDiffOutput(diff, filePath)
  })

  ipcMain.handle(IPC_CHANNELS.GIT_GET_ALL_STAGED_DIFF, async () => {
    const g = getGit()
    const diff = await g.diff(['--cached'])
    const files: FileDiff[] = []
    const fileSections = diff.split(/^diff --git/m).filter(Boolean)
    for (const section of fileSections) {
      const pathMatch = section.match(/a\/(.+?)\s+b\/(.+)/)
      if (pathMatch) {
        files.push(parseDiffOutput(section, pathMatch[2]))
      }
    }
    return files
  })

  // Staging & Commit
  ipcMain.handle(IPC_CHANNELS.GIT_STAGE_FILES, async (_event, paths: string[]) => {
    const g = getGit()
    await g.add(paths)
  })

  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE_FILES, async (_event, paths: string[]) => {
    const g = getGit()
    await g.reset(['HEAD', '--', ...paths])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_DISCARD_CHANGES, async (_event, paths: string[]) => {
    const g = getGit()
    await g.checkout(['--', ...paths])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (_event, message: string) => {
    const g = getGit()
    await g.commit(message)
  })

  ipcMain.handle(IPC_CHANNELS.GIT_AMEND_COMMIT, async (_event, message: string) => {
    const g = getGit()
    await g.commit(message, undefined, { '--amend': null })
  })

  // Branches
  ipcMain.handle(IPC_CHANNELS.GIT_GET_BRANCHES, async () => {
    const g = getGit()
    const summary = await g.branch(['-a'])
    return Object.entries(summary.branches).map(([name, info]) => ({
      name,
      target: info.commit,
      isLocal: !name.startsWith('remotes/'),
      isHead: info.current,
      upstream: null,
    }))
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_CREATE_BRANCH,
    async (_event, name: string, target?: string) => {
      const g = getGit()
      if (target) {
        await g.branch([name, target])
      } else {
        await g.branch([name])
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_DELETE_BRANCH,
    async (_event, name: string, force: boolean = false) => {
      const g = getGit()
      await g.branch([force ? '-D' : '-d', name])
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_SWITCH_BRANCH, async (_event, name: string) => {
    const g = getGit()
    await g.checkout(name)
  })

  // Remotes
  ipcMain.handle(IPC_CHANNELS.GIT_GET_REMOTES, async () => {
    const g = getGit()
    const remotes = await g.getRemotes(true)
    return remotes.map((r) => ({
      name: r.name,
      fetchUrl: r.refs.fetch || '',
      pushUrl: r.refs.push || '',
    }))
  })

  ipcMain.handle(IPC_CHANNELS.GIT_ADD_REMOTE, async (_event, name: string, url: string) => {
    const g = getGit()
    await g.addRemote(name, url)
  })

  ipcMain.handle(IPC_CHANNELS.GIT_REMOVE_REMOTE, async (_event, name: string) => {
    const g = getGit()
    await g.removeRemote(name)
  })

  ipcMain.handle(IPC_CHANNELS.GIT_FETCH, async (_event, remote: string = 'origin') => {
    const g = getGit()
    await g.fetch(remote)
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_PULL,
    async (_event, remote: string = 'origin', branch?: string) => {
      const g = getGit()
      await g.pull(remote, branch)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_PUSH,
    async (_event, remote: string = 'origin', branch?: string, force: boolean = false) => {
      const g = getGit()
      const options: string[] = []
      if (force) options.push('--force')
      if (branch) {
        await g.push(remote, branch, options)
      } else {
        await g.push(remote, undefined, options)
      }
    }
  )

  // Tags
  ipcMain.handle(IPC_CHANNELS.GIT_GET_TAGS, async () => {
    const g = getGit()
    const tags = await g.tags()
    return tags.all.map((t) => ({
      name: t,
      target: '',
      message: null,
      tagger: null,
    }))
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_CREATE_TAG,
    async (_event, name: string, target?: string, message?: string) => {
      const g = getGit()
      if (message) {
        await g.tag(['-a', name, '-m', message, ...(target ? [target] : [])])
      } else {
        await g.tag([name, ...(target ? [target] : [])])
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_DELETE_TAG, async (_event, name: string) => {
    const g = getGit()
    await g.tag(['-d', name])
  })

  // Stash
  ipcMain.handle(IPC_CHANNELS.GIT_GET_STASHES, async () => {
    const g = getGit()
    const stashList = await g.stashList()
    return stashList.all.map((s, i) => ({
      id: i,
      description: s.message,
      commit: s.hash,
    }))
  })

  ipcMain.handle(IPC_CHANNELS.GIT_CREATE_STASH, async (_event, message?: string) => {
    const g = getGit()
    if (message) {
      await g.stash(['push', '-m', message])
    } else {
      await g.stash(['push'])
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_APPLY_STASH, async (_event, stashId: number) => {
    const g = getGit()
    await g.stash(['apply', `stash@{${stashId}}`])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_POP_STASH, async (_event, stashId: number) => {
    const g = getGit()
    await g.stash(['pop', `stash@{${stashId}}`])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_DELETE_STASH, async (_event, stashId: number) => {
    const g = getGit()
    await g.stash(['drop', `stash@{${stashId}}`])
  })

  // Merge
  ipcMain.handle(IPC_CHANNELS.GIT_MERGE, async (_event, branch: string) => {
    const g = getGit()
    await g.merge([branch])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_ABORT_MERGE, async () => {
    const g = getGit()
    await g.merge(['--abort'])
  })

  // Advanced
  ipcMain.handle(IPC_CHANNELS.GIT_REVERT_COMMIT, async (_event, hash: string) => {
    const g = getGit()
    await g.revert(hash)
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_RESET,
    async (_event, target: string, mode: ResetMode = 'mixed') => {
      const g = getGit()
      await g.reset([`--${mode}`, target])
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_GET_GRAPH, async (_event, count: number = 100) => {
    const g = getGit()
    const log = await g.log({
      maxCount: count,
      '--graph': null,
      format: { hash: '%H', summary: '%s', author: '%an <%ae>', time: '%aI', parents: '%P' },
    })
    // Return simplified graph data
    return {
      rows: log.all.map((l: any) => ({
        cells: [],
        commit: {
          hash: l.hash,
          summary: l.summary || l.message?.split('\n')[0] || '',
          message: l.summary || l.message || '',
          author: l.author || `${l.author_name} <${l.author_email}>`,
          committer: l.author || `${l.author_name} <${l.author_email}>`,
          time: l.time || l.date,
          parents: l.parents ? l.parents.split(' ') : [],
        },
        branchLabels: [],
        tagLabels: [],
      })),
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_SEARCH_COMMITS,
    async (_event, query: string, count: number = 50) => {
      const g = getGit()
      const log = await g.log({ maxCount: count, '--grep': query })
      return log.all.map((l) => ({
        hash: l.hash,
        summary: l.message.split('\n')[0],
        message: l.message,
        author: `${l.author_name} <${l.author_email}>`,
        committer: `${l.author_name} <${l.author_email}>`,
        time: l.date,
        parents: [],
      }))
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_FILTER_HISTORY_BY_AUTHOR,
    async (_event, author: string, count: number = 50, skip: number = 0) => {
      const g = getGit()
      const log = await g.log({ maxCount: count, '--skip': skip, '--author': author })
      return log.all.map((l) => ({
        hash: l.hash,
        summary: l.message.split('\n')[0],
        message: l.message,
        author: `${l.author_name} <${l.author_email}>`,
        committer: `${l.author_name} <${l.author_email}>`,
        time: l.date,
        parents: [],
      }))
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_FILTER_HISTORY_BY_FILE,
    async (_event, filePath: string, count: number = 50, skip: number = 0) => {
      const g = getGit()
      const log = await g.log({ maxCount: count, '--skip': skip, file: filePath })
      return log.all.map((l) => ({
        hash: l.hash,
        summary: l.message.split('\n')[0],
        message: l.message,
        author: `${l.author_name} <${l.author_email}>`,
        committer: `${l.author_name} <${l.author_email}>`,
        time: l.date,
        parents: [],
      }))
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_SEARCH_FILES, async (_event, pattern: string) => {
    const g = getGit()
    const result = await g.raw(['ls-files', `*${pattern}*`])
    return result
      .split('\n')
      .filter(Boolean)
      .map((f) => f.trim())
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_FILE_HISTORY,
    async (_event, filePath: string, count: number = 50, skip: number = 0) => {
      const g = getGit()
      const log = await g.log({ maxCount: count, '--skip': skip, file: filePath })
      return log.all.map((l) => ({
        hash: l.hash,
        summary: l.message.split('\n')[0],
        message: l.message,
        author: `${l.author_name} <${l.author_email}>`,
        committer: `${l.author_name} <${l.author_email}>`,
        time: l.date,
        parents: [],
      }))
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_GET_BLAME, async (_event, filePath: string) => {
    const g = getGit()
    const blame = await g.raw(['blame', '--porcelain', filePath])
    const blameLines: BlameLine[] = []
    const lines = blame.split('\n')
    let currentHash = ''
    let currentAuthor = ''
    let currentTime = ''
    let currentSummary = ''
    let lineNum = 0

    for (const line of lines) {
      const headerMatch = line.match(/^([0-9a-f]{40})\s+(\d+)\s+(\d+)/)
      if (headerMatch) {
        currentHash = headerMatch[1]
        lineNum = parseInt(headerMatch[3])
        continue
      }
      if (line.startsWith('author ')) currentAuthor = line.slice(7)
      if (line.startsWith('author-time '))
        currentTime = new Date(parseInt(line.slice(12)) * 1000).toISOString()
      if (line.startsWith('summary ')) currentSummary = line.slice(8)
      if (line.startsWith('\t')) {
        blameLines.push({
          hash: currentHash,
          author: currentAuthor,
          time: currentTime,
          line: lineNum,
          content: line.slice(1),
          summary: currentSummary,
        })
      }
    }
    return blameLines
  })

  ipcMain.handle(IPC_CHANNELS.GIT_GET_REFLOG, async (_event, count: number = 100) => {
    const g = getGit()
    const reflog = await g.raw([
      'reflog',
      '--format=%H %P %an <%ae> %aI %gs',
      `-n${count}`,
    ])
    return reflog
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(' ')
        const newHash = parts[0]
        const oldHash = parts[1] || ''
        // Find the email end to split committer from rest
        const emailEnd = line.indexOf('>') + 1
        const afterEmail = line.slice(emailEnd).trim()
        const timeParts = afterEmail.split(' ')
        return {
          newHash,
          oldHash,
          committer: line.slice(line.indexOf(parts[2]), emailEnd),
          time: timeParts[0] || '',
          message: timeParts.slice(1).join(' '),
        } as ReflogEntry
      })
  })
}
