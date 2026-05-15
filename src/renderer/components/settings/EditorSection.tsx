import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface EditorSectionProps {
  labels: {
    title: string;
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
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
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
            <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="ed-wrap"
                checked={wordWrap}
                onCheckedChange={(checked) =>
                  onWordWrapChange(checked === true)
                }
              />
              <label
                htmlFor="ed-wrap"
                className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-50 cursor-pointer"
              >
                {labels.wordWrap}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ed-mm"
                checked={minimap}
                onCheckedChange={(checked) => onMinimapChange(checked === true)}
              />
              <label
                htmlFor="ed-mm"
                className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-50 cursor-pointer"
              >
                {labels.minimap}
              </label>
            </div>
          </div>

          <Button type="button" onClick={onSave}>
            {labels.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
