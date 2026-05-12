/**
 * App - 应用根组件
 */
import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
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
import { appRoutes, pathToView } from './routes'
import styles from './App.module.scss'

function AppContent() {
  const { repoPath, refreshStatus, loadSettings, loadConflictFiles, setView, currentView, language } = useAppStore()
  const location = useLocation()
  const { i18n } = useTranslation()

  useAppKeyboardShortcuts()
  useTheme()

  useEffect(() => {
    loadSettings().then(() => {
      const state = useAppStore.getState()
      if (state.language && i18n.language !== state.language) {
        i18n.changeLanguage(state.language)
      }
    })
    const unsubscribe = window.api.onRepoChanged(() => {
      refreshStatus()
      loadConflictFiles()
    })
    return () => { unsubscribe() }
  }, [])

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language])

  useEffect(() => {
    const pathname = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '')
    const view = pathToView(pathname)
    if (view !== useAppStore.getState().currentView) {
      setView(view)
    }
  }, [location.pathname])

  return (
    <div className={styles.appContainer}>
      <TitleBar />
      {repoPath && <WorkspaceSwitcher />}
      <div className={styles.bodyRow}>
        {repoPath && <Sidebar />}
        <main className={styles.mainContent}>
          {repoPath && <ConflictResolutionView />}
          <Routes>
            {repoPath
              ? appRoutes.map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))
              : (
                <>
                  <Route path="/" element={<WelcomeView />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
          </Routes>
        </main>
      </div>
      {repoPath && <StatusBar />}
      <ToastContainer />
      <CommandPalette />
    </div>
  )
}

export default AppContent
