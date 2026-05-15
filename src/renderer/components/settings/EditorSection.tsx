import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { SettingsPanel, settingsPanelStyles as ps } from "./SettingsPanel";

interface EditorSectionProps {
  labels: {
    fontSize: string;
    tabSize: string;
    wordWrap: string;
    minimap: string;
    save: string;
  };
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  onFontSizeChange: (value: number) => void;
  onTabSizeChange: (value: number) => void;
  onWordWrapChange: (value: boolean) => void;
  onMinimapChange: (value: boolean) => void;
  onSave: () => void;
}

export function EditorSection({
  labels,
  fontSize,
  tabSize,
  wordWrap,
  minimap,
  onFontSizeChange,
  onTabSizeChange,
  onWordWrapChange,
  onMinimapChange,
  onSave,
}: EditorSectionProps) {
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
            <Label htmlFor="ed-font">{labels.fontSize}</Label>
            <Input
              id="ed-font"
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
            <Label htmlFor="ed-tab">{labels.tabSize}</Label>
            <Input
              id="ed-tab"
              type="number"
              min={1}
              max={12}
              value={tabSize}
              onChange={(event) =>
                onTabSizeChange(Number(event.target.value) || 2)
              }
            />
          </div>
        </div>

        <div className={ps.checkboxGroup}>
          <div className={ps.checkboxRow}>
            <Checkbox
              id="ed-wrap"
              checked={wordWrap}
              onCheckedChange={(checked) =>
                onWordWrapChange(checked === true)
              }
            />
            <label htmlFor="ed-wrap">{labels.wordWrap}</label>
          </div>
          <div className={ps.checkboxRow}>
            <Checkbox
              id="ed-mm"
              checked={minimap}
              onCheckedChange={(checked) => onMinimapChange(checked === true)}
            />
            <label htmlFor="ed-mm">{labels.minimap}</label>
          </div>
        </div>
      </div>
    </SettingsPanel>
  );
}
