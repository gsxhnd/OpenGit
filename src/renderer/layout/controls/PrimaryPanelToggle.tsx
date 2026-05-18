import { PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@renderer/lib/utils";
import { Button } from "@renderer/components/ui/button";
import { useSidebar } from "@renderer/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@renderer/components/ui/tooltip";
import { shellHeaderButtonActiveClass, shellHeaderButtonClass } from "@renderer/lib/shell-chrome";

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

  const label = collapsed
    ? t("workbench.expandSidebar")
    : t("workbench.collapseSidebar");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              shellHeaderButtonClass,
              !collapsed && shellHeaderButtonActiveClass,
              className,
            )}
            onClick={toggleSidebar}
            aria-pressed={!collapsed}
            aria-label={label}
          >
            <PanelLeft size={iconSize} strokeWidth={1.5} />
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
