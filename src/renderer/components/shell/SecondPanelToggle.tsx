import { PanelRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from "../../store";
import { ShellTooltip } from "./ShellTooltip";

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
      <button
        type="button"
        className={cn(
          "flex items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]",
          secondPanelOpen &&
            "bg-[var(--color-secondary)] text-[var(--color-foreground)]",
          className,
        )}
        onClick={() => toggleSecondPanel()}
        aria-pressed={secondPanelOpen}
        aria-label={t("workbench.secondPanelToggle")}
      >
        <PanelRight size={iconSize} strokeWidth={1.5} />
      </button>
    </ShellTooltip>
  );
}
