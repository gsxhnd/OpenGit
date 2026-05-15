/**
 * App root — shared providers, global shortcuts, and route-level layouts.
 * Settings is no longer a route — it opens as a Dialog (SettingsDialog).
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
import { SettingsDialog } from "./components/settings/SettingsDialog";
import { SidebarProvider } from "./components/ui/sidebar";
import { WorkbenchLayout } from "./layout";
import { workbenchRoutes, pathToView } from "./routes";
import { platform } from "@renderer/lib/shell-chrome";
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
      <div className={styles.appContainer} data-platform={platform}>
        <Routes>
          <Route element={<WorkbenchLayout />}>
            {workbenchRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <ToastContainer />
        <CommandPalette />
        <SettingsDialog />
      </div>
    </SidebarProvider>
  );
}

export default AppContent;
