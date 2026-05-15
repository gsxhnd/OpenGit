/**
 * AppMenubar — Win/Linux only custom menu bar using shadcn Menubar.
 * Not rendered on macOS (system menu bar handles this).
 */
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from '../ui/menubar'

export function AppMenubar() {
  const { t } = useTranslation()
  const { toggleSecondPanel, toggleCommandPalette, setSettingsOpen } = useAppStore((s) => ({
    toggleSecondPanel: s.toggleSecondPanel,
    toggleCommandPalette: s.toggleCommandPalette,
    setSettingsOpen: s.setSettingsOpen,
  }))

  const handleQuit = () => window.api.close()
  const handleMinimize = () => window.api.minimize()
  const handleMaximize = () => window.api.maximize()
  const handleFullscreen = () => {
    (window.api as { toggleFullscreen?: () => void }).toggleFullscreen?.()
  }

  return (
    <Menubar className="h-[var(--shell-header-height)] max-h-[var(--shell-header-height)] min-h-0 border-0 rounded-none bg-transparent p-0 gap-0">
      {/* File */}
      <MenubarMenu>
        <MenubarTrigger className="h-[var(--shell-header-height)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] text-xs px-2 py-0">
          {t('menu.file')}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => window.location.hash = '#/connections'}>
            {t('menu.newConnection')}
          </MenubarItem>
          <MenubarItem onClick={() => window.location.hash = '#/local-terminal'}>
            {t('menu.newLocalTerminal')}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => setSettingsOpen(true)}>
            {t('nav.settings')}
            <MenubarShortcut>Ctrl+,</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleQuit} variant="destructive">
            {t('menu.quit')}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Edit */}
      <MenubarMenu>
        <MenubarTrigger className="h-[var(--shell-header-height)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] text-xs px-2 py-0">
          {t('menu.edit')}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => document.execCommand('copy')}>
            {t('menu.copy')}
            <MenubarShortcut>Ctrl+C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => document.execCommand('paste')}>
            {t('menu.paste')}
            <MenubarShortcut>Ctrl+V</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => document.execCommand('selectAll')}>
            {t('menu.selectAll')}
            <MenubarShortcut>Ctrl+A</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* View */}
      <MenubarMenu>
        <MenubarTrigger className="h-[var(--shell-header-height)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] text-xs px-2 py-0">
          {t('menu.view')}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={toggleSecondPanel}>
            {t('menu.toggleSecondPanel')}
            <MenubarShortcut>Ctrl+Alt+I</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={toggleCommandPalette}>
            {t('menu.commandPalette')}
            <MenubarShortcut>Ctrl+Shift+P</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleFullscreen}>
            {t('menu.toggleFullscreen')}
            <MenubarShortcut>F11</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Help */}
      <MenubarMenu>
        <MenubarTrigger className="h-[var(--shell-header-height)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] text-xs px-2 py-0">
          {t('menu.help')}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => {
            (window.api as { showAbout?: () => void }).showAbout?.()
          }}>
            {t('menu.about')}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
