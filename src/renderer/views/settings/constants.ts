export const isDarwin = window.api.platform === "darwin";
export const modKey = isDarwin ? "\u2318" : "Ctrl";

export type SettingsSection =
  | "appearance"
  | "terminal"
  | "editor"
  | "hosts"
  | "shortcuts";

export interface SectionMeta {
  titleKey: string;
  descKey: string;
  wide?: boolean;
}

export const SECTION_META: Record<SettingsSection, SectionMeta> = {
  appearance: {
    titleKey: "settings.appearance",
    descKey: "settings.appearanceDesc",
  },
  terminal: {
    titleKey: "settings.terminal",
    descKey: "settings.terminalDesc",
  },
  editor: {
    titleKey: "settings.editor",
    descKey: "settings.editorDesc",
  },
  hosts: {
    titleKey: "settings.remoteHosts",
    descKey: "settings.remoteHostsHint",
    wide: true,
  },
  shortcuts: {
    titleKey: "settings.shortcuts",
    descKey: "settings.shortcutsDesc",
  },
};
