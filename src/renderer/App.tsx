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

export default function App() {
  const { currentView, repoPath, refreshStatus, loadSettings, loadConflictFiles } = useAppStore()

  // Setup keyboard shortcuts
  useAppKeyboardShortcuts()

  // Setup theme
  useTheme()

  useEffect(() => {
    loadSettings()

    // Listen for file system changes
    const unsubscribe = window.api.onRepoChanged(() => {
      refreshStatus()
      loadConflictFiles()
    })

    return () => {
      unsubscribe()
    }
  }, [])

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
