import { PanelRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@renderer/lib/utils";
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from "@renderer/store";
import { Button } from "@renderer/components/ui/button";
import { ShellTooltip } from "@renderer/components/common/ShellTooltip";

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
    <ShellTooltip content={t("workbench.secondPanelToggleHint")} side="bottom" delay={400}>
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          "text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]",
          secondPanelOpen &&
            "bg-[var(--color-secondary)] text-[var(--color-foreground)]",
          className,
        )}
        onClick={() => toggleSecondPanel()}
        aria-pressed={secondPanelOpen}
        aria-label={t("workbench.secondPanelToggle")}
      >
        <PanelRight size={iconSize} strokeWidth={1.5} />
      </Button>
    </ShellTooltip>
  );
}
