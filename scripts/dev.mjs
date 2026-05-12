import { spawn } from 'node:child_process'
import { createServer, build } from 'vite'
import { watch } from 'node:fs'
import { existsSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const PORT = 5173

const require = createRequire(import.meta.url)

const ELECTRON_PKG = join(ROOT, 'node_modules', 'electron')
const ELECTRON_PKG_BAK = ELECTRON_PKG + '.bak'

function isElectronShimPresent() {
  return existsSync(ELECTRON_PKG) && !existsSync(ELECTRON_PKG_BAK)
}

function disableElectronNpmModule() {
  if (isElectronShimPresent()) {
    renameSync(ELECTRON_PKG, ELECTRON_PKG_BAK)
  }
}

function restoreElectronNpmModule() {
  if (existsSync(ELECTRON_PKG_BAK) && !existsSync(ELECTRON_PKG)) {
    renameSync(ELECTRON_PKG_BAK, ELECTRON_PKG)
  }
}

function viteConfig(target) {
  return join(ROOT, `vite.${target}.config.ts`)
}

/**
 * Resolve the real Electron executable path via the npm shim.
 * Must be called BEFORE disableElectronNpmShim() since it loads the shim.
 */
function resolveElectronPath() {
  // Trigger download if needed and get the electron binary path from the shim
  const electronPath = String(require(join(ROOT, 'node_modules', 'electron')))
  return electronPath
}

function startElectron(url, electronPath) {
  return spawn(
    electronPath,
    ['.'],
    {
      cwd: ROOT,
      env: { ...process.env, ELECTRON_RENDERER_URL: url },
      stdio: 'inherit',
      shell: false,
    }
  )
}

async function dev() {
  console.log('[dev] Building main and preload...')
  await build({ configFile: viteConfig('main') })
  await build({ configFile: viteConfig('preload') })

  const server = await createServer({
    configFile: viteConfig('renderer'),
    server: { port: PORT },
  })
  await server.listen()

  const rendererUrl = `http://localhost:${PORT}`
  console.log(`[dev] Renderer: ${rendererUrl}`)

  // Resolve the real Electron binary path from the shim BEFORE disabling it
  console.log('[dev] Resolving Electron executable...')
  let electronPath = resolveElectronPath()
  console.log(`[dev] Electron path: ${electronPath}`)

  // Move the entire node_modules/electron directory aside so that
  // require('electron') inside the Electron process resolves to the
  // built-in Electron API rather than the npm shim.
  // After moving, the electron binary path shifts from node_modules/electron/dist/electron
  // to node_modules/electron.bak/dist/electron.
  disableElectronNpmModule()
  electronPath = electronPath.replace(ELECTRON_PKG, ELECTRON_PKG_BAK)

  let electronProc = startElectron(rendererUrl, electronPath)

  const watchPaths = [
    join(ROOT, 'src', 'main'),
    join(ROOT, 'src', 'preload'),
    join(ROOT, 'src', 'shared'),
  ]

  const watched = new Set()
  let rebuildTimer = null

  async function rebuildAndRestart(filename) {
    if (!filename || !/\.(ts|tsx|js|jsx)$/.test(filename)) return
    if (watched.has(filename)) return
    watched.add(filename)
    setTimeout(() => watched.delete(filename), 1000)

    console.log(`[dev] Change detected: ${filename}`)
    try {
      await build({ configFile: viteConfig('main') })
      await build({ configFile: viteConfig('preload') })
    } catch (err) {
      console.error('[dev] Build failed:', err.message)
      return
    }

    if (electronProc) {
      electronProc.kill('SIGTERM')
      await new Promise((r) => setTimeout(r, 500))
    }
    // Ensure electron npm module is still moved aside
    disableElectronNpmModule()
    electronProc = startElectron(rendererUrl, electronPath)
  }

  for (const dir of watchPaths) {
    try {
      watch(dir, { recursive: true }, (event, filename) => {
        if (rebuildTimer) clearTimeout(rebuildTimer)
        rebuildTimer = setTimeout(() => rebuildAndRestart(filename), 300)
      })
    } catch (err) {
      console.error(`[dev] Failed to watch ${dir}:`, err.message)
    }
  }

  process.on('SIGINT', () => {
    if (electronProc) electronProc.kill()
    server.close()
    restoreElectronNpmModule()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    if (electronProc) electronProc.kill()
    server.close()
    restoreElectronNpmModule()
    process.exit(0)
  })
}

function cleanupAndExit() {
  restoreElectronNpmModule()
  process.exit(1)
}

process.on('uncaughtException', (err) => {
  console.error('[dev] Fatal error:', err)
  cleanupAndExit()
})

dev().catch(console.error)
