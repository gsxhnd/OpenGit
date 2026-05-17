import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { TerminalSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAppStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import { useSshConnect } from "../hooks/connection/useSshConnect";
import { ActiveSessionsPanel } from "../components/dashboard/ActiveSessionsPanel";
import { SavedHostsPreview } from "../components/dashboard/SavedHostsPreview";
import { QuickConnectSection } from "../components/dashboard/QuickConnectSection";
import styles from "./DashboardView.module.scss";

export function DashboardView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loadSettings, addToast, settings, sessions } = useAppStore(
    useShallow((s) => ({
      loadSettings: s.loadSettings,
      addToast: s.addToast,
      settings: s.settings,
      sessions: s.sessions,
    })),
  );
  const { connecting, doConnect, connectSaved } = useSshConnect();

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const hosts = settings?.hosts ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={styles.container}
    >
      <header className={styles.header}>
        <h1 className={styles.title}>{t("workbench.dashboard")}</h1>
        <p className={styles.subtitle}>{t("welcome.subtitle")}</p>
      </header>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => navigate("/local-terminal")}>
          <TerminalSquare size={14} className="mr-1" />
          {t("welcome.localTerminal")}
        </Button>
        <Button variant="outline" onClick={() => navigate("/connections")}>
          {t("workbench.connections")}
        </Button>
      </div>

      <ActiveSessionsPanel
        sessions={sessions}
        onOpenSession={(id) => navigate(`/session/${id}`)}
        t={t}
        styles={styles}
      />

      <SavedHostsPreview
        hosts={hosts}
        connecting={connecting}
        onConnect={(h) => void connectSaved(h)}
        onViewAll={() => navigate("/connections")}
        t={t}
        styles={styles}
      />

      <QuickConnectSection
        connecting={connecting}
        onConnect={(payload, meta) => void doConnect(payload, meta)}
        addToast={addToast}
        t={t}
        styles={styles}
      />
    </motion.div>
  );
}
