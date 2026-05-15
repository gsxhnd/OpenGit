import { useState } from "react";
import type { HostProfile } from "@shared/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from "../../store";
import { useTranslation } from "react-i18next";
import { SettingsPanel, settingsPanelStyles as ps } from "./SettingsPanel";

interface HostsSectionProps {
  labels: {
    label: string;
    host: string;
    port: string;
    username: string;
    password: string;
    keyPath: string;
    authPassword: string;
    authPrivateKey: string;
    authType: string;
    addHost: string;
    remove: string;
    addNewHost: string;
    savedHosts: string;
    authBadgePassword: string;
    authBadgeKey: string;
  };
  hosts: HostProfile[];
}

export function HostsSection({ labels, hosts }: HostsSectionProps) {
  const { t } = useTranslation();
  const { loadSettings, addToast } = useAppStore(useShallow((s) => ({ loadSettings: s.loadSettings, addToast: s.addToast })));

  const [newLabel, setNewLabel] = useState("");
  const [newHost, setNewHost] = useState("");
  const [newPort, setNewPort] = useState("22");
  const [newUser, setNewUser] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newKeyPath, setNewKeyPath] = useState("");
  const [authType, setAuthType] = useState<"password" | "privateKey">(
    "password",
  );

  const resetForm = () => {
    setNewLabel("");
    setNewHost("");
    setNewUser("");
    setNewPassword("");
    setNewKeyPath("");
    setNewPort("22");
    setAuthType("password");
  };

  const addHost = async () => {
    if (!newLabel.trim() || !newHost.trim() || !newUser.trim()) {
      addToast(t("settings.labelHostUsernameRequired"), "error");
      return;
    }
    const host: Omit<HostProfile, "id"> = {
      label: newLabel.trim(),
      host: newHost.trim(),
      port: Number(newPort) || 22,
      username: newUser.trim(),
      authType,
      password: authType === "password" ? newPassword || undefined : undefined,
      privateKeyPath:
        authType === "privateKey" ? newKeyPath || undefined : undefined,
    };
    try {
      await window.api.hostsAdd(host);
      resetForm();
      await loadSettings();
      addToast(t("settings.hostSaved"), "success");
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t("err.saveFailed"), "error");
    }
  };

  const removeHost = async (id: string) => {
    await window.api.hostsRemove(id);
    await loadSettings();
    addToast(t("settings.hostRemoved"), "info");
  };

  return (
    <SettingsPanel>
      <div className={ps.formStack}>
        <div className={ps.hostFormBlock}>
          <h3 className={ps.subsectionTitle}>{labels.addNewHost}</h3>
          <div className={ps.formGrid}>
            <div className={ps.fieldFull}>
              <Label htmlFor="host-label">{labels.label}</Label>
              <Input
                id="host-label"
                placeholder={labels.label}
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
              />
            </div>
            <div className={ps.field}>
              <Label htmlFor="host-host">{labels.host}</Label>
              <Input
                id="host-host"
                placeholder={labels.host}
                value={newHost}
                onChange={(event) => setNewHost(event.target.value)}
              />
            </div>
            <div className={ps.field}>
              <Label htmlFor="host-port">{labels.port}</Label>
              <Input
                id="host-port"
                placeholder={labels.port}
                value={newPort}
                onChange={(event) => setNewPort(event.target.value)}
              />
            </div>
            <div className={ps.fieldFull}>
              <Label htmlFor="host-username">{labels.username}</Label>
              <Input
                id="host-username"
                placeholder={labels.username}
                value={newUser}
                onChange={(event) => setNewUser(event.target.value)}
              />
            </div>
            <div className={ps.fieldFull}>
              <Label htmlFor="host-auth">{labels.authType}</Label>
              <Select
                value={authType}
                onValueChange={(value) =>
                  value && setAuthType(value as "password" | "privateKey")
                }
              >
                <SelectTrigger id="host-auth" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="password">
                      {labels.authPassword}
                    </SelectItem>
                    <SelectItem value="privateKey">
                      {labels.authPrivateKey}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {authType === "password" ? (
              <div className={ps.fieldFull}>
                <Label htmlFor="host-password">{labels.password}</Label>
                <Input
                  id="host-password"
                  type="password"
                  placeholder={labels.password}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
            ) : (
              <div className={ps.fieldFull}>
                <Label htmlFor="host-keypath">{labels.keyPath}</Label>
                <Input
                  id="host-keypath"
                  placeholder={labels.keyPath}
                  value={newKeyPath}
                  onChange={(event) => setNewKeyPath(event.target.value)}
                />
              </div>
            )}
          </div>
          <Button
            type="button"
            className="w-full mt-4"
            onClick={() => void addHost()}
          >
            {labels.addHost}
          </Button>
        </div>

        {hosts.length > 0 ? (
          <div>
            <h3 className={ps.subsectionTitle}>
              {labels.savedHosts.replace("{{count}}", String(hosts.length))}
            </h3>
            <div className={ps.hostList}>
              {hosts.map((host) => (
                <div key={host.id} className={ps.hostItem}>
                  <div className={ps.hostMeta}>
                    <div className={ps.hostLabel}>
                      <span className="truncate">{host.label}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {host.authType === "password"
                          ? labels.authBadgePassword
                          : labels.authBadgeKey}
                      </Badge>
                    </div>
                    <span className={ps.hostAddress}>
                      {host.username}@{host.host}:{host.port}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="shrink-0"
                    onClick={() => void removeHost(host.id)}
                  >
                    {labels.remove}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SettingsPanel>
  );
}
