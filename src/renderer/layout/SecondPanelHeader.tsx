/**
 * Second panel title bar — panel label; Win/Linux window controls.
 * Panel toggle lives in MainPanelHeader.
 */
import { useTranslation } from "react-i18next";
import { isDesktopChrome } from "@renderer/lib/shell-chrome";
import { WinControls } from "./WinControls";
import styles from "./SecondPanelHeader.module.scss";

export function SecondPanelHeader() {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <span className={styles.titleText}>{t("workbench.secondPanelTitle")}</span>
      </div>
      {isDesktopChrome ? <WinControls /> : null}
    </header>
  );
}
