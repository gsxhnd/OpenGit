/**
 * App root — Phase 0 **workbench skeleton**:
 * Title bar → (Activity Bar | Primary Sidebar | Main: SessionTabs + routes + optional Inspector) → Status bar,
 * plus toasts and command palette. Phase 1 terminal UX is implemented inside routed views (`LocalTerminalView`, `SessionView`).
 */
import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from './store'
import { useAppKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useTheme } from './hooks/useTheme'
import { TitleBar } from './components/shell/TitleBar'
import { ActivityBar } from './components/shell/ActivityBar'
import { PrimarySidebar } from './components/shell/PrimarySidebar'
import { SessionTabs } from './components/shell/SessionTabs'
import { PanelContainer } from './components/shell/PanelContainer'
import { InspectorPanel } from './components/shell/InspectorPanel'
import { StatusBar } from './components/shell/StatusBar'
import { ToastContainer } from './components/shell/ToastContainer'
import { CommandPalette } from './components/shell/CommandPalette'
import { appRoutes, pathToView } from './routes'
import styles from './App.module.scss'

function AppContent() {
  const { loadSettings, language, inspectorOpen, setInspectorOpen, toggleCommandPalette } = useAppStore()
  const location = useLocation()
  const { i18n } = useTranslation()
  const showSessionTabs = location.pathname !== '/'

  useAppKeyboardShortcuts()
  useTheme()

  useEffect(() => {
    void loadSettings().then(() => {
      const state = useAppStore.getState()
      if (state.language && i18n.language !== state.language) {
        void i18n.changeLanguage(state.language)
      }
    })
  }, [loadSettings, i18n])

  useEffect(() => {
    if (language && i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
  }, [language, i18n])

  useEffect(() => {
    const pathname = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '')
    const view = pathToView(pathname)
    if (view !== useAppStore.getState().currentView) {
      useAppStore.getState().setView(view)
    }
  }, [location.pathname])

  return (
    <div className={styles.appContainer}>
      <TitleBar onOpenCommandPalette={() => toggleCommandPalette()} />
      <div className={styles.bodyRow}>
        <ActivityBar />
        <PrimarySidebar />
        <main className={styles.mainContent}>
          <div className={styles.workbenchSplit}>
            <div className={styles.workbenchMain}>
              {showSessionTabs ? <SessionTabs /> : null}
              <PanelContainer>
                <Routes>
                  {appRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </PanelContainer>
            </div>
            {inspectorOpen ? <InspectorPanel onClose={() => setInspectorOpen(false)} /> : null}
          </div>
        </main>
      </div>
      <StatusBar />
      <ToastContainer />
      <CommandPalette />
    </div>
  )
}

export default AppContent
