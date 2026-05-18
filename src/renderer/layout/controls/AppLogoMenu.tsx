/**
 * Win/Linux app logo — opens a popover with the application menubar.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@renderer/components/ui/popover";
import { ShellTooltip } from "@renderer/components/common/ShellTooltip";
import logoUrl from "@renderer/assets/logo.svg";
import { AppMenubar } from "./AppMenubar";
import styles from "./AppLogoMenu.module.scss";

export function AppLogoMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ShellTooltip content={t("titleBar.menu")} side="bottom" delay={400}>
        <PopoverTrigger
          className={styles.trigger}
          aria-label={t("titleBar.menu")}
        >
          <img src={logoUrl} alt="" className={styles.logo} draggable={false} />
        </PopoverTrigger>
      </ShellTooltip>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className={styles.popover}
      >
        <AppMenubar embedded onAction={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
