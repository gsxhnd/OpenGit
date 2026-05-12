/// <reference types="vite/client" />
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

const g = globalThis as typeof globalThis & {
  MonacoEnvironment?: { getWorker: (_workerId: string, _label: string) => Worker }
}

g.MonacoEnvironment = {
  getWorker() {
    return new EditorWorker()
  },
}
