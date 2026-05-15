import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import type { AppNotification, ToastKind } from "@shared/types";
import { useAppStore } from "../../store";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { ShellTooltip } from "./ShellTooltip";
import styles from "./NotificationPopover.module.scss";

function formatNotificationTime(
  createdAt: number,
  locale: string,
  t: (key: string, opts?: { count?: number }) => string,
): string {
  const diff = Date.now() - createdAt;
  if (diff < 60_000) return t("workbench.notifications.justNow");
  if (diff < 3_600_000) {
    return t("workbench.notifications.minutesAgo", {
      count: Math.floor(diff / 60_000),
    });
  }
  return new Date(createdAt).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationIcon({ kind }: { kind: ToastKind }) {
  const props = { size: 14, "aria-hidden": true as const };
  switch (kind) {
    case "success":
      return <CheckCircle2 {...props} />;
    case "error":
      return <XCircle {...props} />;
    default:
      return <Info {...props} />;
  }
}

function NotificationItem({
  item,
  locale,
  onDismiss,
}: {
  item: AppNotification;
  locale: string;
  onDismiss: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className={styles.item} data-unread={!item.read}>
      <span className={styles.itemIcon} data-kind={item.kind}>
        <NotificationIcon kind={item.kind} />
      </span>
      <div className={styles.itemBody}>
        <p className={styles.itemMessage}>{item.message}</p>
        <span className={styles.itemTime}>
          {formatNotificationTime(item.createdAt, locale, t)}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={styles.dismissBtn}
        onClick={() => onDismiss(item.id)}
        aria-label={t("workbench.notifications.dismiss")}
      >
        <X />
      </Button>
    </div>
  );
}

export function NotificationPopover() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    removeNotification,
    clearNotifications,
    markNotificationsRead,
  } = useAppStore();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt - a.createdAt),
    [notifications],
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) markNotificationsRead();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <ShellTooltip
        content={t("workbench.notifications.open")}
        side="top"
        delay={400}
      >
        <PopoverTrigger
          className={styles.trigger}
          aria-label={t("workbench.notifications.open")}
        >
          <Bell size={12} />
          {unreadCount > 0 ? (
            <span className={styles.badge} aria-hidden>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </PopoverTrigger>
      </ShellTooltip>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className={styles.popover}
      >
        <PopoverHeader className={styles.header}>
          <PopoverTitle className={styles.headerTitle}>
            {t("workbench.notifications.title")}
          </PopoverTitle>
          {notifications.length > 0 ? (
            <div className={styles.headerActions}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={styles.clearBtn}
                onClick={() => clearNotifications()}
              >
                {t("workbench.notifications.clearAll")}
              </Button>
            </div>
          ) : null}
        </PopoverHeader>

        {sorted.length === 0 ? (
          <div className={styles.empty} role="status">
            <Bell size={20} strokeWidth={1.25} opacity={0.45} />
            <span>{t("workbench.notifications.empty")}</span>
          </div>
        ) : (
          <ScrollArea className={styles.list}>
            <div role="list">
              {sorted.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  locale={i18n.language}
                  onDismiss={removeNotification}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
