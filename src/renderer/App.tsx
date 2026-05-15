/**
 * App root — shared providers, global shortcuts, and route-level layouts:
 * `SettingsLayout` (standalone settings) vs `WorkbenchLayout` (main shell).
 */
import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAppStore } from "./store";
import { useShallow } from "zustand/react/shallow";
import { useAppKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { ToastContainer } from "./components/shell/ToastContainer";
import { CommandPalette } from "./components/shell/command-palette";
import { SidebarProvider } from "./components/ui/sidebar";
import { SettingsLayout, WorkbenchLayout } from "./layout";
import { SettingsView } from "./views/SettingsView";
import { workbenchRoutes, pathToView, SETTINGS_PATH } from "./routes";
import styles from "./App.module.scss";

function AppContent() {
  const { loadSettings, language } = useAppStore(useShallow((s) => ({ loadSettings: s.loadSettings, language: s.language })));
  const location = useLocation();
  const { i18n } = useTranslation();

  useAppKeyboardShortcuts();
  useTheme();

  useEffect(() => {
    void loadSettings().then(() => {
      const state = useAppStore.getState();
      if (state.language && i18n.language !== state.language) {
        void i18n.changeLanguage(state.language);
      }
    });
  }, [loadSettings, i18n]);

  useEffect(() => {
    if (language && i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    const pathname =
      location.pathname === "/" ? "/" : location.pathname.replace(/\/$/, "");
    const view = pathToView(pathname);
    if (view !== useAppStore.getState().currentView) {
      useAppStore.getState().setView(view);
    }
  }, [location.pathname]);

  return (
    <SidebarProvider defaultOpen={false} style={{ display: "contents" }}>
      <div className={styles.appContainer}>
        <Routes>
          <Route element={<SettingsLayout />}>
            <Route path={SETTINGS_PATH} element={<SettingsView />} />
          </Route>
          <Route element={<WorkbenchLayout />}>
            {workbenchRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <ToastContainer />
        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}

export default AppContent;
