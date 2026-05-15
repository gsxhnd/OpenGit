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
        className="max-w-3xl w-full h-[80vh] p-0 overflow-hidden flex flex-col rounded-xl"
        showCloseButton
      >
        <SettingsView />
      </DialogContent>
    </Dialog>
  )
}
