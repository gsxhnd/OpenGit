import { session } from "electron";
import { join } from "path";
import { existsSync } from "fs";
import { createLogger } from "./logger";

const log = () => createLogger("main");

export async function loadDevExtensions() {
  try {
    const extensionsDir = join(__dirname, "../../extensions");
    const reactDevToolsPath = join(extensionsDir, "react_dev_tool", "7.0.1_0");
    log().debug("React DevTools extension path", { path: reactDevToolsPath });

    if (existsSync(reactDevToolsPath)) {
      try {
        await session.defaultSession.extensions.loadExtension(
          reactDevToolsPath,
          { allowFileAccess: true },
        );
        log().info("React DevTools extension loaded successfully");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        log().warn("Failed to load React DevTools extension", {
          error: message,
        });
      }
    } else {
      log().warn("React DevTools extension path not found", {
        path: reactDevToolsPath,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log().warn("Error loading extensions", { error: message });
  }
}
