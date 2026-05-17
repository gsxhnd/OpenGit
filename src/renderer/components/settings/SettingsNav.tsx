import type { SettingsSection } from "./constants";
import type { LucideIcon } from "lucide-react";
import styles from "../../views/SettingsView.module.scss";

export interface NavEntry {
  id: SettingsSection;
  label: string;
  Icon: LucideIcon;
}

interface SettingsNavProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  navEntries: NavEntry[];
  heading: string;
}

export function SettingsNav({
  activeSection,
  onSectionChange,
  navEntries,
  heading,
}: SettingsNavProps) {
  return (
    <nav className={styles.sidebar} aria-label="Settings sections">
      <div className={styles.sidebarHeading}>{heading}</div>
      {navEntries.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={
            id === activeSection ? styles.navItemActive : styles.navItem
          }
          onClick={() => onSectionChange(id)}
          aria-current={id === activeSection ? "page" : undefined}
        >
          <span className={styles.navIcon}>
            <Icon />
          </span>
          <span className="truncate">{label}</span>
        </button>
      ))}
    </nav>
  );
}
