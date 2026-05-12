/**
 * App - 应用根组件
 *
 * 负责整体布局和视图路由：
 * - TitleBar: 自定义标题栏（macOS traffic light 风格）
 * - WorkspaceSwitcher: 多项目切换标签栏
 * - Sidebar: 左侧导航栏
 * - Main content: 根据 currentView 渲染对应视图
 * - StatusBar: 底部状态栏（分支/ahead/behind）
 * - ToastContainer: 全局通知容器
 * - CommandPalette: 命令面板（Ctrl+Shift+P）
 *
 * 初始化时加载设置、注册文件变更监听。
 */
import { useEffect } from 'react'
import { useAppStore } from './store'
import { useAppKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useTheme } from './hooks/useTheme'
import { TitleBar } from './components/TitleBar'
import { StatusBar } from './components/StatusBar'
import { Sidebar } from './components/Sidebar'
import { ToastContainer } from './components/ToastContainer'
import { ConflictResolutionView } from './components/ConflictResolutionView'
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher'
import { CommandPalette } from './components/CommandPalette'
import { WelcomeView } from './views/WelcomeView'
import { CommitView } from './views/CommitView'
import { HistoryView } from './views/HistoryView'
import { BranchesView } from './views/BranchesView'
import { DiffView } from './views/DiffView'
import { StashView } from './views/StashView'
import { TagsView } from './views/TagsView'
import { GraphView } from './views/GraphView'
import { CommitDetailView } from './views/CommitDetailView'
import { FileSearchView } from './views/FileSearchView'
import { FileHistoryView } from './views/FileHistoryView'
import { BlameView } from './views/BlameView'
import { ReflogView } from './views/ReflogView'
import { SettingsView } from './views/SettingsView'
import { ProjectListView } from './views/ProjectListView'
import { HooksView } from './views/HooksView'

export default function App() {
  const { currentView, repoPath, refreshStatus, loadSettings, loadConflictFiles } = useAppStore()

  // 注册全局键盘快捷键
  useAppKeyboardShortcuts()

  // 初始化主题
  useTheme()

  useEffect(() => {
    // 加载应用设置
    loadSettings()

    // 监听文件系统变更事件（自动刷新状态）
    const unsubscribe = window.api.onRepoChanged(() => {
      refreshStatus()
      loadConflictFiles()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  /** 根据当前视图类型渲染对应组件 */
  const renderView = () => {
    switch (currentView) {
      case 'welcome':
        return <WelcomeView />
      case 'commit':
        return <CommitView />
      case 'history':
        return <HistoryView />
      case 'branches':
        return <BranchesView />
      case 'diff':
        return <DiffView />
      case 'stash':
        return <StashView />
      case 'tags':
        return <TagsView />
      case 'graph':
        return <GraphView />
      case 'detail':
        return <CommitDetailView />
      case 'file-search':
        return <FileSearchView />
      case 'file-history':
        return <FileHistoryView />
      case 'blame':
        return <BlameView />
      case 'reflog':
        return <ReflogView />
      case 'settings':
        return <SettingsView />
      case 'projects':
        return <ProjectListView />
      case 'hooks':
        return <HooksView />
      default:
        return <WelcomeView />
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TitleBar />
      {repoPath && <WorkspaceSwitcher />}
      <div className="flex flex-1 overflow-hidden">
        {repoPath && <Sidebar />}
        <main className="flex-1 overflow-auto flex flex-col">
          {repoPath && <ConflictResolutionView />}
          {renderView()}
        </main>
      </div>
      {repoPath && <StatusBar />}
      <ToastContainer />
      <CommandPalette />
    </div>
  )
}
