import type { Language } from "../../i18n/translations";
import { THEME_NAMES } from "../../hooks/useTheme";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "../ui/select";

interface AppearanceSectionProps {
  title: string;
  themeLabel: string;
  languageLabel: string;
  theme: string;
  language: Language;
  onThemeChange: (theme: string) => void;
  onLanguageChange: (language: Language) => void;
}

export function AppearanceSection({
  title,
  themeLabel,
  languageLabel,
  theme,
  language,
  onThemeChange,
  onLanguageChange,
}: AppearanceSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="theme-select">{themeLabel}</Label>
            <Select
              value={theme}
              onValueChange={(value) => value && onThemeChange(value)}
            >
              <SelectTrigger id="theme-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {THEME_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="language-select">{languageLabel}</Label>
            <Select
              value={language}
              onValueChange={(value) =>
                value && onLanguageChange(value as Language)
              }
            >
              <SelectTrigger id="language-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
