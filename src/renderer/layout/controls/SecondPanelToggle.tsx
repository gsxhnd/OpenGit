import { PanelRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@renderer/lib/utils";
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from "@renderer/store";
import { Button } from "@renderer/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@renderer/components/ui/tooltip";
import { shellHeaderButtonActiveClass, shellHeaderButtonClass } from "@renderer/lib/shell-chrome";

interface SecondPanelToggleProps {
  className?: string;
  iconSize?: number;
}

export function SecondPanelToggle({
  className,
  iconSize = 15,
}: SecondPanelToggleProps) {
  const { t } = useTranslation();
  const { secondPanelOpen, toggleSecondPanel } = useAppStore(
    useShallow((s) => ({ secondPanelOpen: s.secondPanelOpen, toggleSecondPanel: s.toggleSecondPanel })),
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              shellHeaderButtonClass,
              secondPanelOpen && shellHeaderButtonActiveClass,
              className,
            )}
            onClick={() => toggleSecondPanel()}
            aria-pressed={secondPanelOpen}
            aria-label={t("workbench.secondPanelToggle")}
          >
            <PanelRight size={iconSize} strokeWidth={1.5} />
          </Button>
        }
      />
      <TooltipContent side="bottom">{t("workbench.secondPanelToggleHint")}</TooltipContent>
    </Tooltip>
  );
}
