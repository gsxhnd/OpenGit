import { PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@renderer/lib/utils";
import { Button } from "@renderer/components/ui/button";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { ShellTooltip } from "@renderer/components/common/ShellTooltip";

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
      content={
        collapsed
          ? t("workbench.expandSidebar")
          : t("workbench.collapseSidebar")
      }
      side="bottom"
      delay={400}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          "text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]",
          !collapsed &&
            "bg-[var(--color-secondary)] text-[var(--color-foreground)]",
          className,
        )}
        onClick={toggleSidebar}
        aria-pressed={!collapsed}
        aria-label={
          collapsed
            ? t("workbench.expandSidebar")
            : t("workbench.collapseSidebar")
        }
      >
        <PanelLeft size={iconSize} strokeWidth={1.5} />
      </Button>
    </ShellTooltip>
  );
}
