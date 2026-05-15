/**
 * Settings layout — Activity Bar and Status Bar; no Primary Sidebar,
 * Session Tabs, or Inspector.
 */
import { Outlet } from "react-router";
import { useAppStore } from "../store";
import { ActivityBar } from "../components/shell/ActivityBar";
import { StatusBar } from "../components/shell/StatusBar";
import { TitleBar } from "../components/shell/TitleBar";
import styles from "./SettingsLayout.module.scss";

export function SettingsLayout() {
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);

  return (
    <div className={styles.container}>
      <TitleBar onOpenCommandPalette={() => toggleCommandPalette()} />
      <div className={styles.bodyRow}>
        <ActivityBar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
