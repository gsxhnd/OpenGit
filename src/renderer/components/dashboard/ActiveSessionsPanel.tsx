import { Button } from "../ui/button";
import type { RemoteSessionMeta } from "@shared/types";

interface ActiveSessionsPanelProps {
  sessions: RemoteSessionMeta[];
  onOpenSession: (connectionId: string) => void;
  t: (key: string) => string;
  styles: Record<string, string>;
}

export function ActiveSessionsPanel({
  sessions,
  onOpenSession,
  t,
  styles,
}: ActiveSessionsPanelProps) {
  if (sessions.length === 0) return null;

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{t("workbench.sessions")}</h2>
      <ul className={styles.hostList}>
        {sessions.map((session) => (
          <li key={session.connectionId} className={styles.hostItem}>
            <div>
              <div className={styles.hostName}>{session.hostLabel}</div>
              <div className={styles.hostMeta}>
                {session.username}@{session.host}:{session.port}
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenSession(session.connectionId)}
            >
              {t("workbench.openSession")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
