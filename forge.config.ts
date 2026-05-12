import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";

const config: ForgeConfig = {
  packagerConfig: {
    name: "OpenRemote",
    executableName: "openremote",
    appBundleId: "xyz.gsxhnd.openremote",
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin", "linux", "win32"]),
    new MakerDMG({ format: "ULFO" }, ["darwin"]),
    new MakerSquirrel({ name: "OpenRemote" }, ["win32"]),
    new MakerDeb({
      options: {
        maintainer: "OpenRemote",
        homepage: "https://github.com/gsxhnd/OpenRemote",
      },
    }),
    new MakerRpm({}),
  ],
};

export default config;
