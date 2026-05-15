import { spawn } from "node:child_process";
import { createServer, build } from "vite";
import { watch } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const VITE_MAIN = join(ROOT, "vite.main.config.ts");
const VITE_PRELOAD = join(ROOT, "vite.preload.config.ts");
const VITE_RENDERER = join(ROOT, "vite.renderer.config.ts");

function electronBinaryPath() {
  return String(require(join(ROOT, "node_modules", "electron")));
}

function pipeElectronLogs(proc) {
  const prefix = (line, log) => log(`[Electron] ${line}`);
  for (const stream of [proc.stdout, proc.stderr]) {
    if (!stream) continue;
    stream.on("data", (data) => {
      for (const line of String(data).split("\n")) {
        if (!line.trim()) continue;
        prefix(line, stream === proc.stderr ? console.error : console.log);
      }
    });
  }
}

function startElectron(binary) {
  const proc = spawn(binary, ["."], {
    cwd: ROOT,
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
  });
  pipeElectronLogs(proc);
  return proc;
}

async function dev() {
  console.log("[dev] Building main and preload...");
  await build({ configFile: VITE_MAIN, mode: "development" });
  await build({ configFile: VITE_PRELOAD, mode: "development" });

  const server = await createServer({
    configFile: VITE_RENDERER,
    server: { port: 5173, host: "localhost" },
  });
  await server.listen();

  console.log("[dev] Resolving Electron executable...");
  const binary = electronBinaryPath();
  console.log(`[dev] Electron path: ${binary}`);

  let electronProc = startElectron(binary);

  const watchDirs = [
    join(ROOT, "src", "main"),
    join(ROOT, "src", "preload"),
    join(ROOT, "src", "shared"),
  ];

  const debounce = new Set();
  let timer = null;

  async function rebuildAndRestart(filename) {
    if (!filename || !/\.(ts|tsx|js|jsx)$/.test(filename)) return;
    if (debounce.has(filename)) return;
    debounce.add(filename);
    setTimeout(() => debounce.delete(filename), 1000);

    console.log(`[dev] Change detected: ${filename}`);
    try {
      await build({ configFile: VITE_MAIN, mode: "development" });
      await build({ configFile: VITE_PRELOAD, mode: "development" });
    } catch (err) {
      console.error("[dev] Build failed:", err.message);
      return;
    }

    if (electronProc) {
      electronProc.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 500));
    }
    electronProc = startElectron(binary);
  }

  for (const dir of watchDirs) {
    try {
      watch(dir, { recursive: true }, (_event, filename) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => rebuildAndRestart(filename), 300);
      });
    } catch (err) {
      console.error(`[dev] Failed to watch ${dir}:`, err.message);
    }
  }

  const exit = () => {
    if (electronProc) electronProc.kill();
    server.close();
    process.exit(0);
  };
  process.on("SIGINT", exit);
  process.on("SIGTERM", exit);
}

process.on("uncaughtException", (err) => {
  console.error("[dev] Fatal error:", err);
  process.exit(1);
});

dev().catch(console.error);
