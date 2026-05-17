/**
 * SettingsDialog — centered modal dialog wrapping SettingsView.
 * Controlled by `settingsOpen` in the Zustand UiSlice.
 * Opened from the ActivityBar gear icon or ⌘, shortcut.
 */
import { useAppStore } from '../../store'
import {
  Dialog,
  DialogContent,
} from '../ui/dialog'
import { SettingsView } from '../../views/SettingsView'

export function SettingsDialog() {
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent
        className="flex h-[80vh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl p-0 sm:max-w-6xl"
        showCloseButton
      >
        <SettingsView />
      </DialogContent>
    </Dialog>
  )
}
