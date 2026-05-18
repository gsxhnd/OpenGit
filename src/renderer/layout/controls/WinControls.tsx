/**
 * Window minimize / maximize / close — layout chrome for Win/Linux headers.
 */
import { useCallback, useEffect, useState } from "react";
import { Maximize2, Minus, Square, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@renderer/components/ui/tooltip";

const controlWidth = "w-[var(--shell-win-control-width)]";

export function WinControls() {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);

  const refreshMaximized = useCallback(async () => {
    const maximized = await window.api.isMaximized();
    setIsMaximized(maximized ?? false);
  }, []);

  useEffect(() => {
    void refreshMaximized();
    const unsub = window.api.onMaximizedChange?.((v) => setIsMaximized(v));
    return () => unsub?.();
  }, [refreshMaximized]);

  const btnClass = `flex h-full ${controlWidth} items-center justify-center text-[color-mix(in_oklab,var(--color-shell-header-foreground)_68%,transparent)] transition-colors`;

  return (
    <div className="no-drag flex h-full shrink-0 items-stretch">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => window.api.minimize()}
              className={`${btnClass} hover:bg-[color-mix(in_oklab,var(--color-shell-header-foreground)_10%,transparent)] hover:text-[var(--color-shell-header-foreground)]`}
              aria-label={t("titleBar.minimize")}
            >
              <Minus size={14} strokeWidth={1.5} />
            </button>
          }
        />
        <TooltipContent side="bottom">{t("titleBar.minimize")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => window.api.maximize()}
              className={`${btnClass} hover:bg-[color-mix(in_oklab,var(--color-shell-header-foreground)_10%,transparent)] hover:text-[var(--color-shell-header-foreground)]`}
              aria-label={isMaximized ? t("titleBar.restore") : t("titleBar.maximize")}
            >
              {isMaximized ? (
                <Square size={12} strokeWidth={1.5} />
              ) : (
                <Maximize2 size={12} strokeWidth={1.5} />
              )}
            </button>
          }
        />
        <TooltipContent side="bottom">
          {isMaximized ? t("titleBar.restore") : t("titleBar.maximize")}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={() => window.api.close()}
              className={`${btnClass} hover:bg-[var(--color-destructive)] hover:text-[var(--color-destructive-foreground)]`}
              aria-label={t("titleBar.close")}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          }
        />
        <TooltipContent side="bottom">{t("titleBar.close")}</TooltipContent>
      </Tooltip>
    </div>
  );
}
