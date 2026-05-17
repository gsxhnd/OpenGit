import { PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@renderer/lib/utils";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { ShellTooltip } from "./ShellTooltip";

interface PrimaryPanelToggleProps {
  className?: string;
  iconSize?: number;
}

export function PrimaryPanelToggle({
  className,
  iconSize = 15,
}: PrimaryPanelToggleProps) {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <ShellTooltip
      content={collapsed ? t("workbench.expandSidebar") : t("workbench.collapseSidebar")}
      side="bottom"
      delay={400}
    >
      <button
        type="button"
        className={cn(
          "flex items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]",
          !collapsed &&
            "bg-[var(--color-secondary)] text-[var(--color-foreground)]",
          className,
        )}
        onClick={toggleSidebar}
        aria-pressed={!collapsed}
        aria-label={
          collapsed ? t("workbench.expandSidebar") : t("workbench.collapseSidebar")
        }
      >
        <PanelLeft size={iconSize} strokeWidth={1.5} />
      </button>
    </ShellTooltip>
  );
}
