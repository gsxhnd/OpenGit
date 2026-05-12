import { ipcMain, BrowserWindow } from 'electron'
import { execFile } from 'child_process'
import { promisify } from 'util'
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

const execFileAsync = promisify(execFile)

let currentRepoPath: string | null = null

function getRepoPath(): string {
  if (!currentRepoPath) throw new Error('No repository opened')
  return currentRepoPath
}

async function git(args: string[]): Promise<string> {
  const repoPath = getRepoPath()
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: repoPath,
      maxBuffer: 50 * 1024 * 1024,
      encoding: 'utf-8',
    })
    return stdout
  } catch (err: any) {
    const stderr = err.stderr || err.message || ''
    const message = stderr.replace(/\n/g, ' ').trim() || err.message
    throw new Error(message)
  }
}

async function gitSilent(args: string[]): Promise<string> {
  try {
    return await git(args)
  } catch {
    return ''
  }
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
  const repoPath = getRepoPath()

  const [porcelain, logOut, branchOut, remoteOut, tagOut] = await Promise.all([
    gitSilent(['status', '--porcelain', '-u']),
    gitSilent(['log', '-1', '--format=%H%n%s%n%B%n%an <%ae>%n%aI']),
    gitSilent(['branch', '-a', '--format=%(refname:short)%00%(objectname:short)%00%(HEAD)%00%(upstream:short)']),
    gitSilent(['remote', '-v']),
    gitSilent(['tag']),
  ])

  // Parse status
  const stagedFiles: FileEntry[] = []
  const unstagedFiles: FileEntry[] = []
  const untrackedFiles: FileEntry[] = []

  for (const line of porcelain.split('\n').filter(Boolean)) {
    const x = line[0] || ' '
    const y = line[1] || ' '
    let filePath = line.slice(3).trim()

    // Handle renamed files (format: "R  old -> new")
    const renameMatch = filePath.match(/^(.+)\s+->\s+(.+)$/)
    if (renameMatch) {
      filePath = renameMatch[2]
    }

    const status = parseFileStatus(x, y)
    const inIndex = x !== ' ' && x !== '?' && x !== '!' 
    const inWorktree = y !== ' ' && y !== '!' 

    if (status === 'untracked') {
      untrackedFiles.push({ path: filePath, status, staged: false, unstaged: true })
    } else if (inIndex && !inWorktree && status !== 'conflicted') {
      stagedFiles.push({ path: filePath, status, staged: true, unstaged: false })
    } else if (!inIndex && inWorktree) {
      unstagedFiles.push({ path: filePath, status, staged: false, unstaged: true })
    } else if (inIndex && inWorktree) {
      stagedFiles.push({ path: filePath, status, staged: true, unstaged: false })
      if (status === 'conflicted') {
        unstagedFiles.push({ path: filePath, status, staged: false, unstaged: true })
      }
    }
  }

  // Current branch
  let currentBranch: string | null = null
  try {
    currentBranch = (await git(['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
    if (currentBranch === 'HEAD') currentBranch = null
  } catch {}

  // Head commit
  let head: Commit | null = null
  const logLines = logOut.split('\n').filter((l) => l)
  if (logLines.length >= 5) {
    head = {
      hash: logLines[0],
      summary: logLines[1],
      message: logLines.slice(1, 4).join('\n'),
      author: logLines[3],
      committer: logLines[3],
      time: logLines[4],
      parents: [],
    }
  }

  // Branches
  const branches: Branch[] = []
  for (const line of branchOut.split('\n').filter(Boolean)) {
    const parts = line.split('\0')
    const name = parts[0]
    if (!name) continue
    // Skip symbolic HEAD ref
    if (name.includes('->')) continue
    branches.push({
      name,
      target: parts[1] || '',
      isLocal: !name.startsWith('remotes/'),
      isHead: parts[2] === '*',
      upstream: parts[3] || null,
    })
  }

  // Remotes
  const remotes: Remote[] = []
  const seenRemotes = new Set<string>()
  for (const line of remoteOut.split('\n').filter(Boolean)) {
    const parts = line.split('\t')
    if (parts.length < 2) continue
    const name = parts[0]
    if (seenRemotes.has(name)) continue
    seenRemotes.add(name)
    const urlPart = parts[1].replace(' (fetch)', '').replace(' (push)', '')
    remotes.push({ name, fetchUrl: urlPart, pushUrl: urlPart })
  }

  // Tags
  const tags: Tag[] = tagOut.split('\n').filter(Boolean).map((t) => ({
    name: t,
    target: '',
    message: null,
    tagger: null,
  }))

  // Ahead/behind
  let ahead = 0
  let behind = 0
  if (currentBranch) {
    try {
      const upstreamBranch = branches.find(
        (b) => b.name === currentBranch && b.upstream
      )?.upstream
      if (upstreamBranch) {
        const countOut = await gitSilent([
          'rev-list',
          '--count',
          '--left-right',
          `${upstreamBranch}...HEAD`,
        ])
        const parts = countOut.split('\t')
        ahead = parseInt(parts[1]) || 0
        behind = parseInt(parts[0]) || 0
      }
    } catch {}
  }

  const workingTree: WorkingTreeStatus = {
    unstagedFiles,
    stagedFiles,
    untrackedFiles,
    currentBranch,
    mergeHead: null,
    rebaseMerge: false,
  }

  return { status: workingTree, head, branches, remotes, tags, ahead, behind }
}

function parseCommitLogLine(line: string): Commit {
  const parts = line.split('\x1f')
  return {
    hash: parts[0] || '',
    summary: parts[1] || '',
    message: (parts[1] || '') + '\n\n' + (parts[2] || ''),
    author: parts[3] || '',
    committer: parts[3] || '',
    time: parts[4] || '',
    parents: parts[5] ? parts[5].split(' ') : [],
  }
}

async function getCommits(count: number, skip: number = 0): Promise<Commit[]> {
  const out = await gitSilent([
    'log',
    `-${count}`,
    ...(skip > 0 ? [`--skip=${skip}`] : []),
    '--format=%H\x1f%s\x1f%b\x1f%an <%ae>\x1f%aI\x1f%P',
  ])
  return out.split('\n').filter(Boolean).map(parseCommitLogLine)
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
        oldLine: null,
        newLine: null,
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
    try {
      // Verify it's a git repo
      await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: repoPath })
    } catch {
      throw new Error('Not a git repository')
    }

    currentRepoPath = repoPath

    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      setupFileWatcher(repoPath, win)
    }

    return getRepoStatus()
  })

  ipcMain.handle(IPC_CHANNELS.REPO_CLOSE, async () => {
    stopFileWatcher()
    currentRepoPath = null
  })

  ipcMain.handle(IPC_CHANNELS.REPO_GET_STATUS, async () => {
    return getRepoStatus()
  })

  // History
  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_HISTORY,
    async (_event, count: number = 50, skip: number = 0) => {
      return getCommits(count, skip)
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_GET_COMMIT, async (_event, hash: string) => {
    const out = await git([
      'log',
      '-1',
      `--format=%H\x1f%s\x1f%b\x1f%an <%ae>\x1f%aI\x1f%P`,
      hash,
    ])
    const commit = parseCommitLogLine(out.trim())
    if (!commit.hash) throw new Error('Commit not found')
    return commit
  })

  ipcMain.handle(IPC_CHANNELS.GIT_GET_COMMIT_DIFF, async (_event, hash: string) => {
    const diff = await gitSilent(['diff', `${hash}~1`, hash])
    const files: FileDiff[] = []
    const fileSections = diff.split(/^diff --git/m).filter(Boolean)
    for (const section of fileSections) {
      const pathMatch = section.match(/b\/(.+?)(?:\s|$)/m)
      if (pathMatch) {
        files.push(parseDiffOutput(section, pathMatch[1]))
      }
    }
    return files
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_BRANCH_COMMITS,
    async (_event, branch: string, count: number = 50, skip: number = 0) => {
      const out = await gitSilent([
        'log',
        `-${count}`,
        ...(skip > 0 ? [`--skip=${skip}`] : []),
        '--format=%H\x1f%s\x1f%b\x1f%an <%ae>\x1f%aI\x1f%P',
        branch,
      ])
      return out.split('\n').filter(Boolean).map(parseCommitLogLine)
    }
  )

  // Diff
  ipcMain.handle(IPC_CHANNELS.GIT_GET_FILE_DIFF, async (_event, filePath: string) => {
    const diff = await gitSilent(['diff', filePath])
    return parseDiffOutput(diff, filePath)
  })

  ipcMain.handle(IPC_CHANNELS.GIT_GET_STAGED_FILE_DIFF, async (_event, filePath: string) => {
    const diff = await gitSilent(['diff', '--cached', filePath])
    return parseDiffOutput(diff, filePath)
  })

  ipcMain.handle(IPC_CHANNELS.GIT_GET_ALL_STAGED_DIFF, async () => {
    const diff = await gitSilent(['diff', '--cached'])
    const files: FileDiff[] = []
    const fileSections = diff.split(/^diff --git/m).filter(Boolean)
    for (const section of fileSections) {
      const pathMatch = section.match(/b\/(.+?)(?:\s|$)/m)
      if (pathMatch) {
        files.push(parseDiffOutput(section, pathMatch[1]))
      }
    }
    return files
  })

  // Staging & Commit
  ipcMain.handle(IPC_CHANNELS.GIT_STAGE_FILES, async (_event, paths: string[]) => {
    await git(['add', ...paths])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE_FILES, async (_event, paths: string[]) => {
    await git(['reset', 'HEAD', '--', ...paths])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_STAGE_HUNK, async (_event, filePath: string, hunkIndex: number) => {
    // Get the diff for the file
    const diffOutput = await gitSilent(['diff', '--', filePath])
    const fileDiff = parseDiffOutput(diffOutput, filePath)
    
    if (hunkIndex < 0 || hunkIndex >= fileDiff.hunks.length) {
      throw new Error('Invalid hunk index')
    }

    const hunk = fileDiff.hunks[hunkIndex]
    
    // Build a patch for this specific hunk
    let patch = `--- a/${filePath}\n+++ b/${filePath}\n`
    patch += `@@ -${hunk.oldRange.start},${hunk.oldRange.count} +${hunk.newRange.start},${hunk.newRange.count} @@${hunk.header}\n`
    
    for (const line of hunk.lines) {
      patch += line.prefix + line.content + '\n'
    }

    // Apply the patch to the index
    const { execFile } = require('child_process')
    const { promisify } = require('util')
    const execFileAsync = promisify(execFile)
    
    try {
      await execFileAsync('git', ['apply', '--cached', '--unidiff-zero'], {
        cwd: getRepoPath(),
        input: patch,
        encoding: 'utf-8',
      })
    } catch (err: any) {
      throw new Error(`Failed to stage hunk: ${err.message}`)
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE_HUNK, async (_event, filePath: string, hunkIndex: number) => {
    // Get the staged diff for the file
    const diffOutput = await gitSilent(['diff', '--cached', '--', filePath])
    const fileDiff = parseDiffOutput(diffOutput, filePath)
    
    if (hunkIndex < 0 || hunkIndex >= fileDiff.hunks.length) {
      throw new Error('Invalid hunk index')
    }

    const hunk = fileDiff.hunks[hunkIndex]
    
    // Build a reverse patch for this specific hunk
    let patch = `--- a/${filePath}\n+++ b/${filePath}\n`
    patch += `@@ -${hunk.oldRange.start},${hunk.oldRange.count} +${hunk.newRange.start},${hunk.newRange.count} @@${hunk.header}\n`
    
    for (const line of hunk.lines) {
      // Reverse the patch: + becomes -, - becomes +
      const reversedPrefix = line.prefix === '+' ? '-' : line.prefix === '-' ? '+' : ' '
      patch += reversedPrefix + line.content + '\n'
    }

    // Apply the reverse patch to unstage
    const { execFile } = require('child_process')
    const { promisify } = require('util')
    const execFileAsync = promisify(execFile)
    
    try {
      await execFileAsync('git', ['apply', '--cached', '--reverse', '--unidiff-zero'], {
        cwd: getRepoPath(),
        input: patch,
        encoding: 'utf-8',
      })
    } catch (err: any) {
      throw new Error(`Failed to unstage hunk: ${err.message}`)
    }
  })

  ipcMain.handle(IPC_CHANNELS.GIT_DISCARD_CHANGES, async (_event, paths: string[]) => {
    await git(['checkout', '--', ...paths])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (_event, message: string) => {
    await git(['commit', '-m', message])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_AMEND_COMMIT, async (_event, message: string) => {
    await git(['commit', '--amend', '-m', message])
  })

  // Branches
  ipcMain.handle(IPC_CHANNELS.GIT_GET_BRANCHES, async () => {
    const out = await gitSilent([
      'branch',
      '-a',
      '--format=%(refname:short)%00%(objectname:short)%00%(HEAD)%00%(upstream:short)',
    ])
    return out.split('\n').filter(Boolean).map((line) => {
      const parts = line.split('\0')
      return {
        name: parts[0],
        target: parts[1] || '',
        isLocal: !parts[0].startsWith('remotes/'),
        isHead: parts[2] === '*',
        upstream: parts[3] || null,
      }
    })
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_CREATE_BRANCH,
    async (_event, name: string, target?: string) => {
      await git(['branch', name, ...(target ? [target] : [])])
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_DELETE_BRANCH,
    async (_event, name: string, force: boolean = false) => {
      await git(['branch', force ? '-D' : '-d', name])
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_SWITCH_BRANCH, async (_event, name: string) => {
    await git(['checkout', name])
  })

  // Remotes
  ipcMain.handle(IPC_CHANNELS.GIT_GET_REMOTES, async () => {
    const out = await gitSilent(['remote', '-v'])
    const remotes: Remote[] = []
    const seen = new Set<string>()
    for (const line of out.split('\n').filter(Boolean)) {
      const parts = line.split('\t')
      if (parts.length < 2) continue
      const name = parts[0]
      if (seen.has(name)) continue
      seen.add(name)
      const urlPart = parts[1].replace(' (fetch)', '').replace(' (push)', '')
      remotes.push({ name, fetchUrl: urlPart, pushUrl: urlPart })
    }
    return remotes
  })

  ipcMain.handle(IPC_CHANNELS.GIT_ADD_REMOTE, async (_event, name: string, url: string) => {
    await git(['remote', 'add', name, url])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_REMOVE_REMOTE, async (_event, name: string) => {
    await git(['remote', 'remove', name])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_FETCH, async (_event, remote: string = 'origin') => {
    await git(['fetch', remote])
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_PULL,
    async (_event, remote: string = 'origin', branch?: string) => {
      await git(['pull', remote, ...(branch ? [branch] : [])])
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_PUSH,
    async (_event, remote: string = 'origin', branch?: string, force: boolean = false) => {
      const args = ['push', remote]
      if (force) args.push('--force')
      if (branch) args.push(branch)
      await git(args)
    }
  )

  // Tags
  ipcMain.handle(IPC_CHANNELS.GIT_GET_TAGS, async () => {
    const out = await gitSilent(['tag'])
    return out.split('\n').filter(Boolean).map((t) => ({
      name: t,
      target: '',
      message: null,
      tagger: null,
    }))
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_CREATE_TAG,
    async (_event, name: string, target?: string, message?: string) => {
      const args = ['tag']
      if (message) {
        args.push('-a', name, '-m', message)
      } else {
        args.push(name)
      }
      if (target) args.push(target)
      await git(args)
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_DELETE_TAG, async (_event, name: string) => {
    await git(['tag', '-d', name])
  })

  // Stash
  ipcMain.handle(IPC_CHANNELS.GIT_GET_STASHES, async () => {
    const out = await gitSilent(['stash', 'list', '--format=%H%x1f%s'])
    return out.split('\n').filter(Boolean).map((line, i) => {
      const parts = line.split('\x1f')
      return { id: i, description: parts[1] || '', commit: parts[0] || '' }
    })
  })

  ipcMain.handle(IPC_CHANNELS.GIT_CREATE_STASH, async (_event, msg?: string) => {
    const args = ['stash', 'push']
    if (msg) args.push('-m', msg)
    await git(args)
  })

  ipcMain.handle(IPC_CHANNELS.GIT_APPLY_STASH, async (_event, stashId: number) => {
    await git(['stash', 'apply', `stash@{${stashId}}`])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_POP_STASH, async (_event, stashId: number) => {
    await git(['stash', 'pop', `stash@{${stashId}}`])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_DELETE_STASH, async (_event, stashId: number) => {
    await git(['stash', 'drop', `stash@{${stashId}}`])
  })

  // Merge
  ipcMain.handle(IPC_CHANNELS.GIT_MERGE, async (_event, branch: string) => {
    await git(['merge', branch])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_ABORT_MERGE, async () => {
    await git(['merge', '--abort'])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_GET_CONFLICT_FILES, async () => {
    const status = await getRepoStatus()
    return status.status.unstagedFiles.filter((f) => f.status === 'conflicted')
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_RESOLVE_CONFLICT,
    async (_event, filePath: string, resolution: 'ours' | 'theirs') => {
      // Use git checkout to resolve conflicts
      const strategy = resolution === 'ours' ? '--ours' : '--theirs'
      await git(['checkout', strategy, '--', filePath])
      // Stage the resolved file
      await git(['add', filePath])
    }
  )

  // Advanced
  ipcMain.handle(IPC_CHANNELS.GIT_REVERT_COMMIT, async (_event, hash: string) => {
    await git(['revert', '--no-edit', hash])
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_RESET,
    async (_event, target: string, mode: ResetMode = 'mixed') => {
      await git(['reset', `--${mode}`, target])
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_REBASE, async (_event, target: string) => {
    await git(['rebase', target])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_REBASE_CONTINUE, async () => {
    await git(['rebase', '--continue'])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_REBASE_ABORT, async () => {
    await git(['rebase', '--abort'])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_CHERRY_PICK, async (_event, hash: string) => {
    await git(['cherry-pick', hash])
  })

  ipcMain.handle(IPC_CHANNELS.GIT_GET_GRAPH, async (_event, count: number = 100) => {
    const out = await gitSilent([
      'log',
      `-${count}`,
      '--format=%H\x1f%s\x1f%an <%ae>\x1f%aI\x1f%P\x1f%D',
    ])
    const rows = out.split('\n').filter(Boolean).map((line) => {
      const parts = line.split('\x1f')
      const refs = parts[5] || ''
      const branchLabels: string[] = []
      const tagLabels: string[] = []
      if (refs) {
        for (const ref of refs.split(',').map((r) => r.trim())) {
          const m = ref.match(/tag:\s*(.+)/)
          if (m) {
            tagLabels.push(m[1])
          } else if (!ref.startsWith('HEAD')) {
            const branchMatch = ref.match(/^([^/]+(?:\/[^/]+)*)$/)
            if (branchMatch) branchLabels.push(branchMatch[1])
          }
        }
      }
      return {
        cells: [] as any[],
        commit: {
          hash: parts[0],
          summary: parts[1],
          message: parts[1],
          author: parts[2],
          committer: parts[2],
          time: parts[3],
          parents: parts[4] ? parts[4].split(' ') : [],
        },
        branchLabels,
        tagLabels,
      }
    })
    return { rows }
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_SEARCH_COMMITS,
    async (_event, query: string, count: number = 50) => {
      const out = await gitSilent([
        'log',
        `-${count}`,
        '--format=%H\x1f%s\x1f%b\x1f%an <%ae>\x1f%aI\x1f%P',
        `--grep=${query}`,
      ])
      return out.split('\n').filter(Boolean).map(parseCommitLogLine)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_FILTER_HISTORY_BY_AUTHOR,
    async (_event, author: string, count: number = 50, skip: number = 0) => {
      const out = await gitSilent([
        'log',
        `-${count}`,
        ...(skip > 0 ? [`--skip=${skip}`] : []),
        '--format=%H\x1f%s\x1f%b\x1f%an <%ae>\x1f%aI\x1f%P',
        `--author=${author}`,
      ])
      return out.split('\n').filter(Boolean).map(parseCommitLogLine)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_FILTER_HISTORY_BY_FILE,
    async (_event, filePath: string, count: number = 50, skip: number = 0) => {
      const out = await gitSilent([
        'log',
        `-${count}`,
        ...(skip > 0 ? [`--skip=${skip}`] : []),
        '--format=%H\x1f%s\x1f%b\x1f%an <%ae>\x1f%aI\x1f%P',
        '--',
        filePath,
      ])
      return out.split('\n').filter(Boolean).map(parseCommitLogLine)
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_SEARCH_FILES, async (_event, pattern: string) => {
    const out = await gitSilent(['ls-files', `*${pattern}*`])
    return out.split('\n').filter(Boolean).map((f) => f.trim())
  })

  ipcMain.handle(
    IPC_CHANNELS.GIT_GET_FILE_HISTORY,
    async (_event, filePath: string, count: number = 50, skip: number = 0) => {
      const out = await gitSilent([
        'log',
        `-${count}`,
        ...(skip > 0 ? [`--skip=${skip}`] : []),
        '--format=%H\x1f%s\x1f%b\x1f%an <%ae>\x1f%aI\x1f%P',
        '--',
        filePath,
      ])
      return out.split('\n').filter(Boolean).map(parseCommitLogLine)
    }
  )

  ipcMain.handle(IPC_CHANNELS.GIT_GET_BLAME, async (_event, filePath: string) => {
    const out = await gitSilent(['blame', '--porcelain', filePath])
    const blameLines: BlameLine[] = []
    const lines = out.split('\n')
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
    const out = await gitSilent([
      'reflog',
      `-${count}`,
      '--format=%H %P %an <%ae> %aI %gs',
    ])
    return out.split('\n').filter(Boolean).map((line) => {
      const parts = line.split(' ')
      const newHash = parts[0]
      const oldHash = parts[1] || ''
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
