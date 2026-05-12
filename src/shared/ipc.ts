/**
 * IPC channel names — keep in sync with main handlers and preload bridge.
 */

export const IPC_CHANNELS = {
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_THEMES: 'settings:get-themes',

  HOSTS_ADD: 'hosts:add',
  HOSTS_UPDATE: 'hosts:update',
  HOSTS_REMOVE: 'hosts:remove',

  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory',
  DIALOG_OPEN_FILE: 'dialog:open-file',
  DIALOG_SAVE_FILE: 'dialog:save-file',

  // Local PTY (Phase 1) — bytes over IPC as Uint8Array
  PTY_LOCAL_CREATE: 'pty:local:create',
  PTY_LOCAL_WRITE: 'pty:local:write',
  PTY_LOCAL_RESIZE: 'pty:local:resize',
  PTY_LOCAL_KILL: 'pty:local:kill',
  PTY_LOCAL_DATA: 'pty:local:data',
  PTY_LOCAL_EXIT: 'pty:local:exit',

  // SSH shell (Phase 2)
  SSH_CONNECT: 'ssh:connect',
  SSH_DISCONNECT: 'ssh:disconnect',
  SSH_SHELL_START: 'ssh:shell:start',
  SSH_SHELL_WRITE: 'ssh:shell:write',
  SSH_SHELL_RESIZE: 'ssh:shell:resize',
  SSH_DATA: 'ssh:data',
  SSH_SHELL_EXIT: 'ssh:shell:exit',

  // Known hosts (Phase 2)
  KNOWN_HOSTS_LIST: 'known-hosts:list',
  KNOWN_HOSTS_REMOVE: 'known-hosts:remove',
  KNOWN_HOSTS_CLEAR: 'known-hosts:clear',

  // SFTP (Phase 2)
  SFTP_READDIR: 'sftp:readdir',
  SFTP_READ_FILE_TEXT: 'sftp:read-file-text',
  SFTP_WRITE_FILE_TEXT: 'sftp:write-file-text',
  SFTP_MKDIR: 'sftp:mkdir',
  SFTP_RMDIR: 'sftp:rmdir',
  SFTP_UNLINK: 'sftp:unlink',
  SFTP_RENAME: 'sftp:rename',
  SFTP_STAT: 'sftp:stat',
  SFTP_UPLOAD_FROM_LOCAL: 'sftp:upload-from-local',
  SFTP_DOWNLOAD_TO_LOCAL: 'sftp:download-to-local',
  SFTP_TRANSFER_PROGRESS: 'sftp:transfer-progress',
  SFTP_EXISTS: 'sftp:exists',
} as const
