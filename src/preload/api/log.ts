import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc";
import type { RendererLogEntry } from "../../shared/log";

export const logApi = {
  logWrite: (entry: RendererLogEntry) =>
    ipcRenderer.send(IPC_CHANNELS.LOG_WRITE, entry),
};
