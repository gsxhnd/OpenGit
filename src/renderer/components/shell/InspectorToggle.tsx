import { PanelRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from "../../store";
import { ShellTooltip } from "./ShellTooltip";

interface InspectorToggleProps {
  className?: string;
  iconSize?: number;
}

export function InspectorToggle({
  className,
  iconSize = 15,
}: InspectorToggleProps) {
  const { t } = useTranslation();
  const { inspectorOpen, toggleInspector } = useAppStore(useShallow((s) => ({ inspectorOpen: s.inspectorOpen, toggleInspector: s.toggleInspector })));

  return (
    <ShellTooltip content={t("workbench.inspectorToggleHint")} side="bottom" delay={400}>
      <button
        type="button"
        className={cn(
          "flex items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]",
          inspectorOpen &&
            "bg-[var(--color-secondary)] text-[var(--color-foreground)]",
          className,
        )}
        onClick={() => toggleInspector()}
        aria-pressed={inspectorOpen}
        aria-label={t("workbench.inspectorToggle")}
      >
        <PanelRight size={iconSize} strokeWidth={1.5} />
      </button>
    </ShellTooltip>
  );
}
