import { useEffect, useRef, useState } from 'react'
import type * as MonacoTypes from 'monaco-editor'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'

let monacoModule: typeof MonacoTypes | null = null

async function ensureMonaco(): Promise<typeof MonacoTypes> {
  if (monacoModule) return monacoModule
  await import('../monaco-setup')
  const m = await import('monaco-editor')
  monacoModule = m
  return m
}

function languageFromPath(remotePath: string): string {
  const ext = remotePath.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    mts: 'typescript',
    cts: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    xml: 'xml',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    hpp: 'cpp',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    sql: 'sql',
    toml: 'ini',
    ini: 'ini',
  }
  return map[ext] || 'plaintext'
}

export interface RemoteMonacoEditorProps {
  connectionId: string
  remotePath: string
  initialText: string
  fontSize: number
  tabSize: number
  wordWrap: 'on' | 'off'
  minimap: boolean
  onClose: () => void
  onSaved: () => void
  addToast: (msg: string, kind: 'success' | 'error' | 'info') => void
}

export function RemoteMonacoEditor({
  connectionId,
  remotePath,
  initialText,
  fontSize,
  tabSize,
  wordWrap,
  minimap,
  onClose,
  onSaved,
  addToast,
}: RemoteMonacoEditorProps) {
  const { t } = useTranslation()
  const divRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<MonacoTypes.editor.IStandaloneCodeEditor | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void ensureMonaco().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready) return
    const monaco = monacoModule!
    const el = divRef.current
    if (!el) return
    const model = monaco.editor.createModel(initialText, languageFromPath(remotePath), monaco.Uri.parse(`sftp://${connectionId}${remotePath}`))
    const ed = monaco.editor.create(el, {
      model,
      fontSize,
      tabSize,
      wordWrap: wordWrap === 'on' ? 'on' : 'off',
      minimap: { enabled: minimap },
      automaticLayout: true,
      scrollBeyondLastLine: false,
    })
    editorRef.current = ed

    const disposer = ed.addAction({
      id: 'save-remote',
      label: 'Save to remote',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => { void handleSave() },
    })

    return () => {
      disposer.dispose()
      ed.dispose()
      model.dispose()
      editorRef.current = null
    }
  }, [ready, connectionId, remotePath, initialText, fontSize, tabSize, wordWrap, minimap])

  const handleSave = async () => {
    const ed = editorRef.current
    if (!ed) return
    try {
      const text = ed.getValue()
      await window.api.sftpWriteFileText(connectionId, remotePath, text)
      addToast(t('editor.savedToRemote'), 'success')
      onSaved()
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : t('editor.saveFailed'), 'error')
    }
  }

  return (
    <div className="flex h-full min-h-[200px] flex-col border-t border-white/10 bg-[#16161e]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1">
        <span className="truncate text-xs text-white/70">{remotePath}</span>
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="secondary" onClick={handleSave}>
            {t('editor.save')}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t('editor.close')}
          </Button>
        </div>
      </div>
      <div ref={divRef} className="min-h-0 flex-1" />
    </div>
  )
}
