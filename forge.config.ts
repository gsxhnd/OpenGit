import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";

const config: ForgeConfig = {
  packagerConfig: {
    name: "OpenGit",
    executableName: "opengit",
    appBundleId: "xyz.gsxhnd.opengit",
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin"]),
    new MakerDMG({ format: "ULFO" }, ["darwin"]),
    new MakerSquirrel({ name: "OpenGit" }, ["win32"]),
    new MakerDeb({
      options: {
        maintainer: "OpenGit",
        homepage: "https://github.com/gsxhnd/OpenGit",
      },
    }),
    new MakerRpm({}),
  ],
};

export default config;
