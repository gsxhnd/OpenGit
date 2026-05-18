/**
 * Second panel body — properties, transfers, diagnostics tabs.
 * Header is rendered by WorkbenchLayout (SecondPanelHeader).
 */
import { useState } from "react";
import { Bug, FileUp, Server } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@renderer/store";
import { Button } from "@renderer/components/ui/button";
import styles from "./SecondPanel.module.scss";

type SecondPanelTab = "properties" | "transfers" | "diagnostics";

const TAB_ITEMS: {
  key: SecondPanelTab;
  icon: typeof Server;
  labelKey: string;
}[] = [
  { key: "properties", icon: Server, labelKey: "workbench.inspectorTabProperties" },
  { key: "transfers", icon: FileUp, labelKey: "workbench.inspectorTabTransfers" },
  { key: "diagnostics", icon: Bug, labelKey: "workbench.inspectorTabDiagnostics" },
];

function PropertiesTab() {
  const { t } = useTranslation();
  const { sessions, activeSessionId } = useAppStore(
    useShallow((s) => ({ sessions: s.sessions, activeSessionId: s.activeSessionId })),
  );
  const active = sessions.find((s) => s.connectionId === activeSessionId);

  if (!active) {
    return <p className={styles.placeholder}>{t("workbench.inspectorNoConnection")}</p>;
  }

  return (
    <dl className={styles.propertiesList}>
      <div className={styles.propertyRow}>
        <dt>{t("welcome.host")}</dt>
        <dd>{active.host}</dd>
      </div>
      <div className={styles.propertyRow}>
        <dt>{t("welcome.port")}</dt>
        <dd>{active.port}</dd>
      </div>
      <div className={styles.propertyRow}>
        <dt>{t("welcome.username")}</dt>
        <dd>{active.username}</dd>
      </div>
      {active.fingerprint ? (
        <div className={styles.propertyRow}>
          <dt>Fingerprint</dt>
          <dd className={styles.mono}>{active.fingerprint}</dd>
        </div>
      ) : null}
      <div className={styles.propertyRow}>
        <dt>{t("workbench.status.protocol")}</dt>
        <dd>SSH</dd>
      </div>
      <div className={styles.propertyRow}>
        <dt>Status</dt>
        <dd
          className={
            active.status === "connected" ? styles.statusConnected : styles.statusOther
          }
        >
          {active.status}
        </dd>
      </div>
    </dl>
  );
}

function TransfersTab() {
  const { t } = useTranslation();
  return <p className={styles.placeholder}>{t("workbench.transferQueueEmpty")}</p>;
}

function DiagnosticsTab() {
  const { t } = useTranslation();
  return <p className={styles.placeholder}>{t("workbench.inspectorNoContent")}</p>;
}

export function SecondPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SecondPanelTab>("properties");

  return (
    <>
      <nav className={styles.tabBar} aria-label="Second panel tabs">
        {TAB_ITEMS.map(({ key, icon: Icon, labelKey }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            className={activeTab === key ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(key)}
            aria-selected={activeTab === key}
          >
            <Icon size={14} />
            <span>{t(labelKey)}</span>
          </Button>
        ))}
      </nav>
      <div className={styles.body}>
        {activeTab === "properties" && <PropertiesTab />}
        {activeTab === "transfers" && <TransfersTab />}
        {activeTab === "diagnostics" && <DiagnosticsTab />}
      </div>
    </>
  );
}
