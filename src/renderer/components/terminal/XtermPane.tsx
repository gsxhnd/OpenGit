/**
 * Phase 1 — xterm.js 封装：
 * - **Local**：`ptyLocalCreate` + `onPtyLocalData`（主进程 node-pty）
 * - **SSH**：仅订阅 `onSshData`；Shell 流由 `SessionView` 在挂载时 `sshShellStart` 打开
 *
 * 字体 / 滚动 / 光标来自设置；Windows 本地 Shell 类型由 `windowsShell` 传入并在主进程解析为可执行文件。
 */
import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export type XtermMode = { kind: 'local' } | { kind: 'ssh'; connectionId: string }

export interface XtermPaneProps {
  mode: XtermMode
  fontSize: number
  fontFamily: string
  scrollback: number
  cursorStyle?: 'block' | 'underline' | 'bar'
  windowsShell?: 'powershell' | 'cmd' | 'wsl'
  /** Theme color overrides for xterm.js */
  theme?: { background?: string; foreground?: string; cursor?: string; selectionBackground?: string }
  onExit?: () => void
}

export function XtermPane({ mode, fontSize, fontFamily, scrollback, cursorStyle = 'block', windowsShell, theme, onExit }: XtermPaneProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const term = new Terminal({
      fontSize,
      fontFamily,
      scrollback,
      cursorBlink: true,
      cursorStyle,
      theme: theme ?? {},
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(el)
    fit.fit()

    const unsubs: Array<() => void> = []

    term.onData((d) => {
      if (mode.kind === 'local') {
        const sid = sessionIdRef.current
        if (sid) void window.api.ptyLocalWrite(sid, d)
      } else {
        void window.api.sshShellWrite(mode.connectionId, d)
      }
    })

    const applyResize = () => {
      fit.fit()
      const { cols, rows } = term
      if (mode.kind === 'local') {
        const sid = sessionIdRef.current
        if (sid) void window.api.ptyLocalResize(sid, cols, rows)
      } else {
        void window.api.sshShellResize(mode.connectionId, cols, rows)
      }
    }

    const ro = new ResizeObserver(() => applyResize())
    ro.observe(el)

    async function boot() {
      if (mode.kind === 'local') {
        const { sessionId } = await window.api.ptyLocalCreate({
          cols: term.cols,
          rows: term.rows,
          shell: windowsShell,
        })
        sessionIdRef.current = sessionId
        unsubs.push(
          window.api.onPtyLocalData(({ sessionId: sid, data }) => {
            if (sid === sessionId) term.write(new Uint8Array(data))
          }),
        )
        unsubs.push(
          window.api.onPtyLocalExit(({ sessionId: sid }) => {
            if (sid === sessionId) onExit?.()
          }),
        )
      } else {
        unsubs.push(
          window.api.onSshData(({ connectionId, data }) => {
            if (connectionId === mode.connectionId) term.write(new Uint8Array(data))
          }),
        )
        unsubs.push(
          window.api.onSshShellExit(({ connectionId }) => {
            if (connectionId === mode.connectionId) onExit?.()
          }),
        )
        applyResize()
      }
    }

    void boot()

    return () => {
      ro.disconnect()
      unsubs.forEach((u) => u())
      if (mode.kind === 'local' && sessionIdRef.current) {
        void window.api.ptyLocalKill(sessionIdRef.current)
        sessionIdRef.current = null
      }
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mode switches remount terminal
  }, [mode.kind, mode.kind === 'ssh' ? mode.connectionId : 'local', fontSize, fontFamily, scrollback, cursorStyle, windowsShell])

  return <div ref={wrapRef} className="h-full min-h-[120px] w-full overflow-hidden rounded-md bg-background p-1" />
}
