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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";

interface HostsSectionProps {
  labels: {
    title: string;
    hint: string;
    label: string;
    host: string;
    port: string;
    username: string;
    password: string;
    keyPath: string;
    authPassword: string;
    authPrivateKey: string;
    addHost: string;
    remove: string;
  };
  hosts: HostProfile[];
  form: {
    label: string;
    host: string;
    port: string;
    username: string;
    password: string;
    keyPath: string;
    authType: "password" | "privateKey";
  };
  onFormChange: (partial: Partial<HostsSectionProps["form"]>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function HostsSection({
  labels,
  hosts,
  form,
  onFormChange,
  onAdd,
  onRemove,
}: HostsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.hint}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Form for adding new host */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
            <h3 className="text-sm font-medium">Add New Host</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="host-label">{labels.label}</Label>
                <Input
                  id="host-label"
                  placeholder={labels.label}
                  value={form.label}
                  onChange={(event) =>
                    onFormChange({ label: event.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="host-host">{labels.host}</Label>
                <Input
                  id="host-host"
                  placeholder={labels.host}
                  value={form.host}
                  onChange={(event) =>
                    onFormChange({ host: event.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="host-port">{labels.port}</Label>
                <Input
                  id="host-port"
                  placeholder={labels.port}
                  value={form.port}
                  onChange={(event) =>
                    onFormChange({ port: event.target.value })
                  }
                />
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="host-username">{labels.username}</Label>
                <Input
                  id="host-username"
                  placeholder={labels.username}
                  value={form.username}
                  onChange={(event) =>
                    onFormChange({ username: event.target.value })
                  }
                />
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="host-auth">{labels.authPassword}</Label>
                <Select
                  value={form.authType}
                  onValueChange={(value) =>
                    value &&
                    onFormChange({
                      authType: value as "password" | "privateKey",
                    })
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

              {form.authType === "password" ? (
                <div className="col-span-2 flex flex-col gap-2">
                  <Label htmlFor="host-password">{labels.password}</Label>
                  <Input
                    id="host-password"
                    type="password"
                    placeholder={labels.password}
                    value={form.password}
                    onChange={(event) =>
                      onFormChange({ password: event.target.value })
                    }
                  />
                </div>
              ) : (
                <div className="col-span-2 flex flex-col gap-2">
                  <Label htmlFor="host-keypath">{labels.keyPath}</Label>
                  <Input
                    id="host-keypath"
                    placeholder={labels.keyPath}
                    value={form.keyPath}
                    onChange={(event) =>
                      onFormChange({ keyPath: event.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <Button type="button" className="w-full" onClick={onAdd}>
              {labels.addHost}
            </Button>
          </div>

          {/* List of hosts */}
          {hosts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Saved Hosts ({hosts.length})
              </h3>
              <div className="space-y-2">
                {hosts.map((host) => (
                  <div
                    key={host.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {host.label}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {host.authType === "password" ? "Password" : "Key"}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {host.username}@{host.host}:{host.port}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemove(host.id)}
                    >
                      {labels.remove}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
