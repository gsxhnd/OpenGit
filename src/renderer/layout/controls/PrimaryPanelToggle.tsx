import { PanelLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@renderer/lib/utils";
import { Button } from "@renderer/components/ui/button";
import { useAppStore } from "@renderer/store";
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
  const primaryPanelOpen = useAppStore((s) => s.primaryPanelOpen);
  const togglePrimaryPanel = useAppStore((s) => s.togglePrimaryPanel);

  const label = primaryPanelOpen
    ? t("workbench.collapseSidebar")
    : t("workbench.expandSidebar");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              shellHeaderButtonClass,
              primaryPanelOpen && shellHeaderButtonActiveClass,
              className,
            )}
            onClick={togglePrimaryPanel}
            aria-pressed={primaryPanelOpen}
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
