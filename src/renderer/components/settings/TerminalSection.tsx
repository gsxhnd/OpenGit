import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "../ui/select";
import { SettingsPanel, settingsPanelStyles as ps } from "./SettingsPanel";

interface TerminalSectionProps {
  showWindowsShell: boolean;
  labels: {
    fontSize: string;
    scrollback: string;
    fontFamily: string;
    cursorStyle: string;
    cursorBlock: string;
    cursorUnderline: string;
    cursorBar: string;
    windowsShell: string;
    save: string;
  };
  fontSize: number;
  scrollback: number;
  fontFamily: string;
  cursorStyle: "block" | "underline" | "bar";
  windowsShell: "powershell" | "cmd" | "wsl";
  onFontSizeChange: (value: number) => void;
  onScrollbackChange: (value: number) => void;
  onFontFamilyChange: (value: string) => void;
  onCursorStyleChange: (value: "block" | "underline" | "bar") => void;
  onWindowsShellChange: (value: "powershell" | "cmd" | "wsl") => void;
  onSave: () => void;
}

export function TerminalSection({
  showWindowsShell,
  labels,
  fontSize,
  scrollback,
  fontFamily,
  cursorStyle,
  windowsShell,
  onFontSizeChange,
  onScrollbackChange,
  onFontFamilyChange,
  onCursorStyleChange,
  onWindowsShellChange,
  onSave,
}: TerminalSectionProps) {
  return (
    <SettingsPanel
      footer={
        <Button type="button" onClick={onSave}>
          {labels.save}
        </Button>
      }
    >
      <div className={ps.formStack}>
        <div className={ps.formGrid}>
          <div className={ps.field}>
            <Label htmlFor="term-font">{labels.fontSize}</Label>
            <Input
              id="term-font"
              type="number"
              min={10}
              max={32}
              value={fontSize}
              onChange={(event) =>
                onFontSizeChange(Number(event.target.value) || 14)
              }
            />
          </div>
          <div className={ps.field}>
            <Label htmlFor="term-scroll">{labels.scrollback}</Label>
            <Input
              id="term-scroll"
              type="number"
              min={1000}
              max={500000}
              step={1000}
              value={scrollback}
              onChange={(event) =>
                onScrollbackChange(Number(event.target.value) || 5000)
              }
            />
          </div>
        </div>

        <div className={ps.fieldFull}>
          <Label htmlFor="term-ff">{labels.fontFamily}</Label>
          <Input
            id="term-ff"
            value={fontFamily}
            onChange={(event) => onFontFamilyChange(event.target.value)}
          />
        </div>

        <div className={ps.field}>
          <Label htmlFor="term-cursor">{labels.cursorStyle}</Label>
          <Select
            value={cursorStyle}
            onValueChange={(value) =>
              value &&
              onCursorStyleChange(value as "block" | "underline" | "bar")
            }
          >
            <SelectTrigger id="term-cursor" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="block">{labels.cursorBlock}</SelectItem>
                <SelectItem value="underline">
                  {labels.cursorUnderline}
                </SelectItem>
                <SelectItem value="bar">{labels.cursorBar}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {showWindowsShell ? (
          <div className={ps.field}>
            <Label htmlFor="term-shell">{labels.windowsShell}</Label>
            <Select
              value={windowsShell}
              onValueChange={(value) =>
                value &&
                onWindowsShellChange(value as "powershell" | "cmd" | "wsl")
              }
            >
              <SelectTrigger id="term-shell" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="powershell">PowerShell</SelectItem>
                  <SelectItem value="cmd">cmd</SelectItem>
                  <SelectItem value="wsl">WSL</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
    </SettingsPanel>
  );
}
