/**
 * Shell chrome constants — shared by main (BrowserWindow) and renderer (panel headers).
 * Keep macOS traffic-light position in sync with --shell-traffic-light-padding.
 */
export const SHELL_CHROME = {
  darwin: {
    headerHeight: 38,
    trafficLight: { x: 12, y: 13 },
    /** Left padding reserved for traffic lights in primary panel header */
    trafficLightPadding: 76,
    iconSize: 15,
    controlSize: 28,
  },
  win32: {
    headerHeight: 32,
    iconSize: 13,
    controlSize: 24,
    winControlWidth: 46,
  },
  linux: {
    headerHeight: 32,
    iconSize: 13,
    controlSize: 24,
    winControlWidth: 46,
  },
} as const;

export type ShellPlatform = keyof typeof SHELL_CHROME;

export function getShellChrome(platform: NodeJS.Platform) {
  if (platform === "darwin") return SHELL_CHROME.darwin;
  if (platform === "win32") return SHELL_CHROME.win32;
  return SHELL_CHROME.linux;
}
