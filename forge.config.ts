import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { join } from "path";

const iconPath = join(__dirname, "assets", "icon");

const config: ForgeConfig = {
  packagerConfig: {
    name: "Puck",
    executableName: "puck",
    appBundleId: "xyz.gsxhnd.puck",
    asar: true,
    icon: iconPath,
    appCopyright: `Copyright © ${new Date().getFullYear()} Puck contributors`,
    appCategoryType: "public.app-category.developer-tools",
    extendInfo: {
      NSMicrophoneUsageDescription: "",
      NSCameraUsageDescription: "",
    },
  },

  rebuildConfig: {},

  makers: [
    new MakerZIP({}, ["darwin", "linux", "win32"]),
    new MakerDMG(
      {
        format: "ULFO",
        icon: `${iconPath}.icns`,
        iconSize: 80,
        contents: [
          {
            x: 192,
            y: 344,
            type: "file",
            path: join(
              __dirname,
              "out",
              "Puck-darwin-arm64",
              "Puck.app",
            ),
          },
          { x: 448, y: 344, type: "link", path: "/Applications" },
        ],
      },
      ["darwin"],
    ),
    new MakerSquirrel(
      {
        name: "Puck",
        setupIcon: `${iconPath}.ico`,
        iconUrl:
          "https://raw.githubusercontent.com/gsxhnd/Puck/main/assets/icon.ico",
        loadingGif: undefined,
        noMsi: false,
      },
      ["win32"],
    ),
    new MakerDeb({
      options: {
        maintainer: "Puck",
        homepage: "https://github.com/gsxhnd/Puck",
        icon: `${iconPath}.png`,
        section: "utils",
        priority: "optional",
        categories: ["Development", "Network"],
        description:
          "Multi-platform SSH, SFTP, and remote editing desktop application",
      },
    }),
    new MakerRpm({
      options: {
        homepage: "https://github.com/gsxhnd/Puck",
        icon: `${iconPath}.png`,
        categories: ["Development", "Network"],
        description:
          "Multi-platform SSH, SFTP, and remote editing desktop application",
      },
    }),
  ],

  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "gsxhnd",
          name: "Puck",
        },
        prerelease: false,
        draft: true,
      },
    },
  ],

  plugins: [],
};

export default config;
