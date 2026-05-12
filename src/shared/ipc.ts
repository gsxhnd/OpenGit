/**
 * IPC 通道名称常量
 *
 * 定义主进程和渲染进程之间所有 IPC 通信的通道名称。
 * 按功能模块分组，确保通道名称唯一且语义清晰。
 *
 * 命名规则：`模块:操作` (如 git:stage-files, settings:get)
 */
export const IPC_CHANNELS = {
  // ============ 仓库管理 ============
  /** 打开仓库（验证 + 初始化文件监听） */
  REPO_OPEN: 'git:repo-open',
  /** 关闭仓库（停止文件监听） */
  REPO_CLOSE: 'git:repo-close',
  /** 获取仓库完整状态（分支、变更、远程等） */
  REPO_GET_STATUS: 'git:repo-get-status',

  // ============ 历史记录 ============
  /** 获取提交历史（支持分页） */
  GIT_GET_HISTORY: 'git:get-history',
  /** 获取单个提交详情 */
  GIT_GET_COMMIT: 'git:get-commit',
  /** 获取提交的 diff 内容 */
  GIT_GET_COMMIT_DIFF: 'git:get-commit-diff',
  /** 获取指定分支的提交列表 */
  GIT_GET_BRANCH_COMMITS: 'git:get-branch-commits',

  // ============ Diff 差异 ============
  /** 获取未暂存文件的 diff */
  GIT_GET_FILE_DIFF: 'git:get-file-diff',
  /** 获取已暂存文件的 diff */
  GIT_GET_STAGED_FILE_DIFF: 'git:get-staged-file-diff',
  /** 获取所有已暂存文件的 diff */
  GIT_GET_ALL_STAGED_DIFF: 'git:get-all-staged-diff',

  // ============ 暂存与提交 ============
  /** 暂存文件（git add） */
  GIT_STAGE_FILES: 'git:stage-files',
  /** 取消暂存文件（git reset HEAD） */
  GIT_UNSTAGE_FILES: 'git:unstage-files',
  /** 暂存单个 Hunk（通过 patch apply） */
  GIT_STAGE_HUNK: 'git:stage-hunk',
  /** 取消暂存单个 Hunk（通过 reverse patch） */
  GIT_UNSTAGE_HUNK: 'git:unstage-hunk',
  /** 丢弃工作区变更（git checkout --） */
  GIT_DISCARD_CHANGES: 'git:discard-changes',
  /** 创建提交 */
  GIT_COMMIT: 'git:commit',
  /** 修改最后一次提交 */
  GIT_AMEND_COMMIT: 'git:amend-commit',

  // ============ 分支管理 ============
  /** 获取所有分支列表 */
  GIT_GET_BRANCHES: 'git:get-branches',
  /** 创建新分支 */
  GIT_CREATE_BRANCH: 'git:create-branch',
  /** 删除分支 */
  GIT_DELETE_BRANCH: 'git:delete-branch',
  /** 切换分支 */
  GIT_SWITCH_BRANCH: 'git:switch-branch',

  // ============ 远程仓库 ============
  /** 获取远程仓库列表 */
  GIT_GET_REMOTES: 'git:get-remotes',
  /** 添加远程仓库 */
  GIT_ADD_REMOTE: 'git:add-remote',
  /** 移除远程仓库 */
  GIT_REMOVE_REMOTE: 'git:remove-remote',
  /** 从远程获取（fetch） */
  GIT_FETCH: 'git:fetch',
  /** 从远程拉取（pull） */
  GIT_PULL: 'git:pull',
  /** 推送到远程（push） */
  GIT_PUSH: 'git:push',

  // ============ 标签管理 ============
  /** 获取所有标签 */
  GIT_GET_TAGS: 'git:get-tags',
  /** 创建标签（轻量/附注） */
  GIT_CREATE_TAG: 'git:create-tag',
  /** 删除标签 */
  GIT_DELETE_TAG: 'git:delete-tag',

  // ============ Stash 暂存区 ============
  /** 获取 stash 列表 */
  GIT_GET_STASHES: 'git:get-stashes',
  /** 创建 stash */
  GIT_CREATE_STASH: 'git:create-stash',
  /** 应用 stash（不删除） */
  GIT_APPLY_STASH: 'git:apply-stash',
  /** 弹出 stash（应用并删除） */
  GIT_POP_STASH: 'git:pop-stash',
  /** 删除 stash */
  GIT_DELETE_STASH: 'git:delete-stash',

  // ============ 合并与冲突 ============
  /** 合并分支 */
  GIT_MERGE: 'git:merge',
  /** 中止合并 */
  GIT_ABORT_MERGE: 'git:abort-merge',
  /** 解决冲突（ours/theirs 策略） */
  GIT_RESOLVE_CONFLICT: 'git:resolve-conflict',
  /** 获取冲突文件列表 */
  GIT_GET_CONFLICT_FILES: 'git:get-conflict-files',

  // ============ 高级 Git 操作 ============
  /** 撤销提交（创建反向提交） */
  GIT_REVERT_COMMIT: 'git:revert-commit',
  /** 重置 HEAD（soft/mixed/hard） */
  GIT_RESET: 'git:reset',
  /** 变基到目标分支 */
  GIT_REBASE: 'git:rebase',
  /** 继续变基 */
  GIT_REBASE_CONTINUE: 'git:rebase-continue',
  /** 中止变基 */
  GIT_REBASE_ABORT: 'git:rebase-abort',
  /** 精选提交到当前分支 */
  GIT_CHERRY_PICK: 'git:cherry-pick',
  /** 获取提交图数据 */
  GIT_GET_GRAPH: 'git:get-graph',
  /** 按作者筛选历史 */
  GIT_FILTER_HISTORY_BY_AUTHOR: 'git:filter-history-by-author',
  /** 按文件路径筛选历史 */
  GIT_FILTER_HISTORY_BY_FILE: 'git:filter-history-by-file',
  /** 搜索提交（按消息内容） */
  GIT_SEARCH_COMMITS: 'git:search-commits',
  /** 搜索仓库中的文件 */
  GIT_SEARCH_FILES: 'git:search-files',
  /** 获取单文件的修改历史 */
  GIT_GET_FILE_HISTORY: 'git:get-file-history',
  /** 获取文件的 blame 信息 */
  GIT_GET_BLAME: 'git:get-blame',
  /** 获取 reflog 记录 */
  GIT_GET_REFLOG: 'git:get-reflog',

  // ============ Git Hooks 管理 ============
  /** 获取所有 Hook 的状态和内容 */
  GIT_GET_HOOKS: 'git:get-hooks',
  /** 切换 Hook 启用/禁用状态 */
  GIT_TOGGLE_HOOK: 'git:toggle-hook',
  /** 保存 Hook 脚本内容 */
  GIT_SAVE_HOOK: 'git:save-hook',
  /** 删除 Hook 脚本 */
  GIT_DELETE_HOOK: 'git:delete-hook',

  // ============ 设置与工作区 ============
  /** 获取应用设置 */
  SETTINGS_GET: 'settings:get',
  /** 更新应用设置 */
  SETTINGS_SET: 'settings:set',
  /** 获取可用主题列表 */
  SETTINGS_GET_THEMES: 'settings:get-themes',
  /** 添加工作区项目 */
  WORKSPACE_ADD_ENTRY: 'workspace:add-entry',
  /** 移除工作区项目 */
  WORKSPACE_REMOVE_ENTRY: 'workspace:remove-entry',
  /** 更新工作区项目信息 */
  WORKSPACE_UPDATE_ENTRY: 'workspace:update-entry',
  /** 重新排序工作区项目 */
  WORKSPACE_REORDER_ENTRIES: 'workspace:reorder-entries',
  /** 设置活跃工作区 */
  WORKSPACE_SET_ACTIVE: 'workspace:set-active',
  /** 添加工作区分组 */
  WORKSPACE_ADD_GROUP: 'workspace:add-group',
  /** 移除工作区分组 */
  WORKSPACE_REMOVE_GROUP: 'workspace:remove-group',

  // ============ 窗口控制 ============
  /** 最小化窗口 */
  WINDOW_MINIMIZE: 'window:minimize',
  /** 最大化/还原窗口 */
  WINDOW_MAXIMIZE: 'window:maximize',
  /** 关闭窗口 */
  WINDOW_CLOSE: 'window:close',

  // ============ 系统对话框 ============
  /** 打开目录选择对话框 */
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory',

  // ============ 事件通知（主进程 → 渲染进程） ============
  /** 仓库文件变更通知 */
  REPO_CHANGED: 'git:repo-changed',
} as const
