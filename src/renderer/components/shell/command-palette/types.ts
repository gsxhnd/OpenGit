export interface PaletteCommand {
  id: string
  label: string
  description?: string
  action: () => void
  keybinding?: string
}

export interface ScoredPaletteCommand {
  command: PaletteCommand
  score: number
  matches: readonly number[]
}
