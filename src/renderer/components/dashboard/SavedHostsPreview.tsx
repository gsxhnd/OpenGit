import { Server } from "lucide-react";
import { Button } from "../ui/button";
import type { HostProfile } from "@shared/types";

interface SavedHostsPreviewProps {
  hosts: HostProfile[];
  connecting: boolean;
  onConnect: (host: HostProfile) => void;
  onViewAll: () => void;
  t: (key: string) => string;
  styles: Record<string, string>;
}

export function SavedHostsPreview({
  hosts,
  connecting,
  onConnect,
  onViewAll,
  t,
  styles,
}: SavedHostsPreviewProps) {
  if (hosts.length === 0) return null;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t("welcome.savedHosts")}</h2>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          {t("workbench.connections")} →
        </Button>
      </div>
      <ul className={styles.hostList}>
        {hosts.slice(0, 5).map((h) => (
          <li key={h.id} className={styles.hostItem}>
            <div className={styles.hostInfo}>
              <Server size={14} className={styles.hostIcon} />
              <div>
                <div className={styles.hostName}>{h.label}</div>
                <div className={styles.hostMeta}>
                  {h.username}@{h.host}:{h.port}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={connecting}
              onClick={() => onConnect(h)}
            >
              {t("welcome.connect")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
