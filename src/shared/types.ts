/**
 * Shared types — main, preload, renderer
 */

export interface WindowConfig {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

/** Base fields shared by all host profiles */
interface HostProfileBase {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  /** If set, host key must match (from ssh:connect result) */
  trustedFingerprint?: string;
}

interface HostProfilePassword extends HostProfileBase {
  authType: "password";
  /** Stored only if user chooses to save password (local config) */
  password?: string;
  privateKeyPath?: never;
  passphrase?: never;
}

interface HostProfilePrivateKey extends HostProfileBase {
  authType: "privateKey";
  password?: never;
  privateKeyPath?: string;
  passphrase?: string;
}

/** Saved SSH host bookmark (discriminated on `authType`) */
export type HostProfile = HostProfilePassword | HostProfilePrivateKey;

export interface TerminalSettings {
  fontSize: number;
  scrollback: number;
  fontFamily: string;
  cursorStyle: "block" | "underline" | "bar";
  windowsShell: "powershell" | "cmd" | "wsl";
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: "on" | "off";
  minimap: boolean;
}

export interface AppSettings {
  window: WindowConfig;
  theme: string;
  language: string;
  hosts: HostProfile[];
  terminal: TerminalSettings;
  editor: EditorSettings;
}

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
  createdAt: number;
}

/** Persistent notification shown in the status bar popover */
export interface AppNotification extends Toast {
  read: boolean;
}

/** App navigation views */
export type ViewType =
  | "dashboard"
  | "connections"
  | "local-terminal"
  | "session"
  | "files";

/**
 * Workbench session tab metadata (see docs/dev/05-information-architecture.md, session model).
 * Renderer builds tabs via `buildWorkbenchSessionTabs` (local + `RemoteSessionMeta` rows).
 */
export type WorkbenchSessionConnectionType = "ssh" | "local-terminal" | "sftp";

export type SessionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed"
  | "disconnected";

export interface WorkbenchSessionTabModel {
  /** Stable row key (equals `connectionId` for SSH; fixed id for local tab). */
  id: string;
  connectionId: string;
  connectionType: WorkbenchSessionConnectionType;
  title: string;
  status: SessionStatus;
  /** Hash route for NavLink / navigate when the tab is selected */
  routePath: string;
  /** Local shell tab is not closed from the strip */
  closable: boolean;
}

/** Active remote session (after connect) */
export interface RemoteSessionMeta {
  connectionId: string;
  hostLabel: string;
  username: string;
  host: string;
  port: number;
  /** Server host key fingerprint from last connect */
  fingerprint?: string;
  /** Session lifecycle status (defaults to 'connecting' when added to store) */
  status?: SessionStatus;
}

export interface SftpListEntry {
  name: string;
  longname: string;
  isDirectory: boolean;
  size: number;
  mtimeMs: number | null;
}

/** Local file system entry */
export interface LocalFileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  mtimeMs: number;
}

/** Known host entry (fingerprint store) */
export interface KnownHostEntry {
  host: string;
  port: number;
  fingerprint: string;
  addedAt: number;
}

/** One-time connect payload (password may be omitted if saved on host) */
export interface SshConnectPayload {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  expectedFingerprint?: string;
}

export interface SshConnectResult {
  connectionId: string;
  fingerprint: string;
  /** true when this is the first connection to this host (fingerprint newly saved) */
  isNewHost: boolean;
}

/** SFTP file transfer progress event payload (shared across main/preload/renderer) */
export interface SftpTransferProgress {
  connectionId: string;
  remotePath: string;
  kind: "upload" | "download";
  bytes: number;
  total: number;
  done: boolean;
  error?: string;
}
