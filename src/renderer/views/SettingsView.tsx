import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useState } from 'react'

export function SettingsView() {
  const { settings, updateSettings, goBack } = useAppStore()
  const [theme, setTheme] = useState(settings?.theme || 'Tokyo Night')

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    if (settings) {
      updateSettings({ ...settings, theme: newTheme })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button
          onClick={goBack}
          className="px-2 py-0.5 text-xs rounded hover:bg-secondary text-muted-foreground"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-8">
          {/* Appearance */}
          <section>
            <h2 className="text-base font-semibold mb-4">Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-background text-foreground"
                >
                  <option>Tokyo Night</option>
                  <option>Dracula</option>
                  <option>Nord</option>
                  <option>Solarized Dark</option>
                  <option>Solarized Light</option>
                </select>
              </div>
            </div>
          </section>

          {/* Editor */}
          <section>
            <h2 className="text-base font-semibold mb-4">Editor</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Font Size</label>
                <Input
                  type="number"
                  min="10"
                  max="20"
                  defaultValue="12"
                  className="w-24"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Word Wrap</span>
                </label>
              </div>
            </div>
          </section>

          {/* Git */}
          <section>
            <h2 className="text-base font-semibold mb-4">Git</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Default Commit Message</label>
                <Input
                  placeholder="Enter default commit message template"
                  className="w-full"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Auto-fetch on startup</span>
                </label>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h2 className="text-base font-semibold mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span>Go to Commit View</span>
                <kbd className="px-2 py-1 bg-secondary rounded">Ctrl+1</kbd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>Go to History View</span>
                <kbd className="px-2 py-1 bg-secondary rounded">Ctrl+2</kbd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>Go to Branches View</span>
                <kbd className="px-2 py-1 bg-secondary rounded">Ctrl+3</kbd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>Go to Graph View</span>
                <kbd className="px-2 py-1 bg-secondary rounded">Ctrl+4</kbd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>Stage All</span>
                <kbd className="px-2 py-1 bg-secondary rounded">Ctrl+Shift+A</kbd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span>Unstage All</span>
                <kbd className="px-2 py-1 bg-secondary rounded">Ctrl+Shift+U</kbd>
              </div>
              <div className="flex justify-between py-2">
                <span>Command Palette</span>
                <kbd className="px-2 py-1 bg-secondary rounded">Ctrl+Shift+P</kbd>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h2 className="text-base font-semibold mb-4">About</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>OpenGit v1.0.0</p>
              <p>A modern Git client for developers</p>
              <p className="pt-2">
                <a href="#" className="text-primary hover:underline">
                  GitHub Repository
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  )
}
