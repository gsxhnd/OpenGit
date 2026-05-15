import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import styles from "./SettingsPanel.module.scss";

interface SettingsPanelProps {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SettingsPanel({ children, footer, className }: SettingsPanelProps) {
  return (
    <section className={cn(styles.panel, className)}>
      <div className={styles.body}>{children}</div>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </section>
  );
}

export { styles as settingsPanelStyles };
