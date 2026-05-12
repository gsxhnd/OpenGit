/**
 * App root layout — title bar, side nav, routes, toasts, command palette.
 */
import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppStore } from './store'
import { useAppKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useTheme } from './hooks/useTheme'
import { TitleBar } from './components/TitleBar'
import { AppNav } from './components/AppNav'
import { ToastContainer } from './components/ToastContainer'
import { CommandPalette } from './components/CommandPalette'
import { appRoutes, pathToView } from './routes'
import styles from './App.module.scss'

function AppContent() {
  const { loadSettings, language } = useAppStore()
  const location = useLocation()
  const { i18n } = useTranslation()

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
      <TitleBar />
      <div className={styles.bodyRow}>
        <AppNav />
        <main className={styles.mainContent}>
          <Routes>
            {appRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
      <CommandPalette />
    </div>
  )
}

export default AppContent
