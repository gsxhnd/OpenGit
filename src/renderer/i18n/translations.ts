export const translations = {
  en: {
    // Navigation
    'nav.commit': 'Commit',
    'nav.history': 'History',
    'nav.branches': 'Branches',
    'nav.stash': 'Stash',
    'nav.tags': 'Tags',
    'nav.graph': 'Graph',
    'nav.settings': 'Settings',

    // Actions
    'action.stage': 'Stage',
    'action.unstage': 'Unstage',
    'action.stageAll': 'Stage All',
    'action.unstageAll': 'Unstage All',
    'action.commit': 'Commit',
    'action.push': 'Push',
    'action.pull': 'Pull',
    'action.fetch': 'Fetch',
    'action.merge': 'Merge',
    'action.rebase': 'Rebase',
    'action.cherryPick': 'Cherry Pick',
    'action.reset': 'Reset',
    'action.revert': 'Revert',
    'action.discard': 'Discard',

    // Messages
    'msg.stageSuccess': 'Changes staged',
    'msg.unstageSuccess': 'Changes unstaged',
    'msg.commitSuccess': 'Commit created',
    'msg.pushSuccess': 'Pushed to remote',
    'msg.pullSuccess': 'Pulled from remote',
    'msg.fetchSuccess': 'Fetched from remote',
    'msg.mergeSuccess': 'Merged successfully',
    'msg.rebaseSuccess': 'Rebased successfully',
    'msg.cherryPickSuccess': 'Cherry-picked successfully',
    'msg.resetSuccess': 'Reset successfully',
    'msg.revertSuccess': 'Reverted successfully',
    'msg.discardSuccess': 'Changes discarded',

    // Errors
    'err.stageFailed': 'Failed to stage changes',
    'err.unstageFailed': 'Failed to unstage changes',
    'err.commitFailed': 'Failed to create commit',
    'err.pushFailed': 'Failed to push',
    'err.pullFailed': 'Failed to pull',
    'err.fetchFailed': 'Failed to fetch',
    'err.mergeFailed': 'Failed to merge',
    'err.rebaseFailed': 'Failed to rebase',
    'err.cherryPickFailed': 'Failed to cherry-pick',
    'err.resetFailed': 'Failed to reset',
    'err.revertFailed': 'Failed to revert',
    'err.discardFailed': 'Failed to discard changes',

    // UI
    'ui.back': '← Back',
    'ui.close': 'Close',
    'ui.save': 'Save',
    'ui.cancel': 'Cancel',
    'ui.delete': 'Delete',
    'ui.add': 'Add',
    'ui.remove': 'Remove',
    'ui.edit': 'Edit',
    'ui.search': 'Search',
    'ui.noResults': 'No results found',
    'ui.loading': 'Loading...',
  },
  zh: {
    // Navigation
    'nav.commit': '提交',
    'nav.history': '历史',
    'nav.branches': '分支',
    'nav.stash': '暂存',
    'nav.tags': '标签',
    'nav.graph': '图表',
    'nav.settings': '设置',

    // Actions
    'action.stage': '暂存',
    'action.unstage': '取消暂存',
    'action.stageAll': '全部暂存',
    'action.unstageAll': '全部取消暂存',
    'action.commit': '提交',
    'action.push': '推送',
    'action.pull': '拉取',
    'action.fetch': '获取',
    'action.merge': '合并',
    'action.rebase': '变基',
    'action.cherryPick': '精选',
    'action.reset': '重置',
    'action.revert': '撤销',
    'action.discard': '丢弃',

    // Messages
    'msg.stageSuccess': '变更已暂存',
    'msg.unstageSuccess': '变更已取消暂存',
    'msg.commitSuccess': '提交已创建',
    'msg.pushSuccess': '已推送到远程',
    'msg.pullSuccess': '已从远程拉取',
    'msg.fetchSuccess': '已从远程获取',
    'msg.mergeSuccess': '合并成功',
    'msg.rebaseSuccess': '变基成功',
    'msg.cherryPickSuccess': '精选成功',
    'msg.resetSuccess': '重置成功',
    'msg.revertSuccess': '撤销成功',
    'msg.discardSuccess': '变更已丢弃',

    // Errors
    'err.stageFailed': '暂存变更失败',
    'err.unstageFailed': '取消暂存变更失败',
    'err.commitFailed': '创建提交失败',
    'err.pushFailed': '推送失败',
    'err.pullFailed': '拉取失败',
    'err.fetchFailed': '获取失败',
    'err.mergeFailed': '合并失败',
    'err.rebaseFailed': '变基失败',
    'err.cherryPickFailed': '精选失败',
    'err.resetFailed': '重置失败',
    'err.revertFailed': '撤销失败',
    'err.discardFailed': '丢弃变更失败',

    // UI
    'ui.back': '← 返回',
    'ui.close': '关闭',
    'ui.save': '保存',
    'ui.cancel': '取消',
    'ui.delete': '删除',
    'ui.add': '添加',
    'ui.remove': '移除',
    'ui.edit': '编辑',
    'ui.search': '搜索',
    'ui.noResults': '未找到结果',
    'ui.loading': '加载中...',
  },
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en

export function useI18n(language: Language = 'en') {
  return {
    t: (key: TranslationKey, defaultValue?: string): string => {
      return translations[language][key] || defaultValue || key
    },
    language,
  }
}
