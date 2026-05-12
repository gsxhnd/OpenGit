// IPC channel names shared between main and renderer
export const IPC_CHANNELS = {
  // Repository
  REPO_OPEN: 'git:repo-open',
  REPO_CLOSE: 'git:repo-close',
  REPO_GET_STATUS: 'git:repo-get-status',

  // History
  GIT_GET_HISTORY: 'git:get-history',
  GIT_GET_COMMIT: 'git:get-commit',
  GIT_GET_COMMIT_DIFF: 'git:get-commit-diff',
  GIT_GET_BRANCH_COMMITS: 'git:get-branch-commits',

  // Diff
  GIT_GET_FILE_DIFF: 'git:get-file-diff',
  GIT_GET_STAGED_FILE_DIFF: 'git:get-staged-file-diff',
  GIT_GET_ALL_STAGED_DIFF: 'git:get-all-staged-diff',

  // Staging & Commit
  GIT_STAGE_FILES: 'git:stage-files',
  GIT_UNSTAGE_FILES: 'git:unstage-files',
  GIT_STAGE_HUNK: 'git:stage-hunk',
  GIT_UNSTAGE_HUNK: 'git:unstage-hunk',
  GIT_DISCARD_CHANGES: 'git:discard-changes',
  GIT_COMMIT: 'git:commit',
  GIT_AMEND_COMMIT: 'git:amend-commit',

  // Branches
  GIT_GET_BRANCHES: 'git:get-branches',
  GIT_CREATE_BRANCH: 'git:create-branch',
  GIT_DELETE_BRANCH: 'git:delete-branch',
  GIT_SWITCH_BRANCH: 'git:switch-branch',

  // Remotes
  GIT_GET_REMOTES: 'git:get-remotes',
  GIT_ADD_REMOTE: 'git:add-remote',
  GIT_REMOVE_REMOTE: 'git:remove-remote',
  GIT_FETCH: 'git:fetch',
  GIT_PULL: 'git:pull',
  GIT_PUSH: 'git:push',

  // Tags
  GIT_GET_TAGS: 'git:get-tags',
  GIT_CREATE_TAG: 'git:create-tag',
  GIT_DELETE_TAG: 'git:delete-tag',

  // Stash
  GIT_GET_STASHES: 'git:get-stashes',
  GIT_CREATE_STASH: 'git:create-stash',
  GIT_APPLY_STASH: 'git:apply-stash',
  GIT_POP_STASH: 'git:pop-stash',
  GIT_DELETE_STASH: 'git:delete-stash',

  // Merge
  GIT_MERGE: 'git:merge',
  GIT_ABORT_MERGE: 'git:abort-merge',
  GIT_RESOLVE_CONFLICT: 'git:resolve-conflict',
  GIT_GET_CONFLICT_FILES: 'git:get-conflict-files',

  // Advanced
  GIT_REVERT_COMMIT: 'git:revert-commit',
  GIT_RESET: 'git:reset',
  GIT_REBASE: 'git:rebase',
  GIT_REBASE_CONTINUE: 'git:rebase-continue',
  GIT_REBASE_ABORT: 'git:rebase-abort',
  GIT_CHERRY_PICK: 'git:cherry-pick',
  GIT_GET_GRAPH: 'git:get-graph',
  GIT_FILTER_HISTORY_BY_AUTHOR: 'git:filter-history-by-author',
  GIT_FILTER_HISTORY_BY_FILE: 'git:filter-history-by-file',
  GIT_SEARCH_COMMITS: 'git:search-commits',
  GIT_SEARCH_FILES: 'git:search-files',
  GIT_GET_FILE_HISTORY: 'git:get-file-history',
  GIT_GET_BLAME: 'git:get-blame',
  GIT_GET_REFLOG: 'git:get-reflog',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_THEMES: 'settings:get-themes',
  WORKSPACE_ADD_ENTRY: 'workspace:add-entry',
  WORKSPACE_REMOVE_ENTRY: 'workspace:remove-entry',
  WORKSPACE_UPDATE_ENTRY: 'workspace:update-entry',
  WORKSPACE_REORDER_ENTRIES: 'workspace:reorder-entries',
  WORKSPACE_SET_ACTIVE: 'workspace:set-active',
  WORKSPACE_ADD_GROUP: 'workspace:add-group',
  WORKSPACE_REMOVE_GROUP: 'workspace:remove-group',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // Dialog
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory',

  // File watcher events (main -> renderer)
  REPO_CHANGED: 'git:repo-changed',
} as const
