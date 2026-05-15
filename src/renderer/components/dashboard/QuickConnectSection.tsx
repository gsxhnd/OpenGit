import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { SshConnectPayload } from "@shared/types";
import type { ToastKind } from "@shared/types";

interface QuickConnectSectionProps {
  connecting: boolean;
  onConnect: (
    payload: SshConnectPayload,
    meta: { hostLabel: string },
  ) => void;
  addToast: (message: string, kind: ToastKind) => void;
  t: (key: string) => string;
  styles: Record<string, string>;
}

export function QuickConnectSection({
  connecting,
  onConnect,
  addToast,
  t,
  styles,
}: QuickConnectSectionProps) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");

  const handleQuickConnect = () => {
    const parsedPort = Number(port) || 22;
    if (!host.trim() || !username.trim()) {
      addToast(t("welcome.hostUsernameRequired"), "error");
      return;
    }
    if (!password.trim()) {
      addToast(t("welcome.passwordRequired"), "error");
      return;
    }

    void onConnect(
      { host: host.trim(), port: parsedPort, username: username.trim(), password },
      { hostLabel: label.trim() || host.trim() },
    );
  };

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{t("welcome.quickConnect")}</h2>
      <div className={styles.formGrid}>
        <label className={styles.label}>
          {t("welcome.label")}
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My server"
          />
        </label>
        <label className={styles.label}>
          {t("welcome.host")}
          <Input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="192.168.1.10"
          />
        </label>
        <label className={styles.label}>
          {t("welcome.port")}
          <Input value={port} onChange={(e) => setPort(e.target.value)} />
        </label>
        <label className={styles.label}>
          {t("welcome.username")}
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ubuntu"
          />
        </label>
        <label className={`${styles.label} ${styles.fullRow}`}>
          {t("welcome.password")}
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>
      </div>

      <Button
        className={styles.connectBtn}
        size="lg"
        disabled={connecting}
        onClick={handleQuickConnect}
      >
        {connecting ? t("welcome.connecting") : t("welcome.connect")}
      </Button>
    </section>
  );
}
