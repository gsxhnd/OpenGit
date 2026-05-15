/**
 * Second panel title bar — close button; Win/Linux window controls.
 */
import { PanelRightClose } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ShellTooltip } from "@renderer/components/shell/ShellTooltip";
import { Button } from "@renderer/components/ui/button";
import { cn } from "@renderer/lib/utils";
import { isDesktopChrome } from "@renderer/lib/shell-chrome";
import { WinControls } from "./WinControls";
import styles from "./SecondPanelHeader.module.scss";

interface SecondPanelHeaderProps {
  onClose: () => void;
}

export function SecondPanelHeader({ onClose }: SecondPanelHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className={styles.header}>
      <div className={cn("no-drag", styles.actions)}>
        <ShellTooltip content={t("workbench.secondPanelClose")} side="bottom" delay={300}>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label={t("workbench.secondPanelClose")}
          >
            <PanelRightClose size={16} />
          </Button>
        </ShellTooltip>
      </div>
      <div className={styles.title}>
        <span className={styles.titleText}>{t("workbench.secondPanelTitle")}</span>
      </div>
      {isDesktopChrome ? <WinControls /> : null}
    </header>
  );
}
