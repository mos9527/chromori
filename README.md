# ChrOMORI

OMORI in a browser

![hero_capitalism](.github/assets/hero_capitalism.png)

# Prerequisites

- [OMORI](https://store.steampowered.com/app/1150690/OMORI)
- [Node.js](https://nodejs.org) (Select LTS)
- pnpm: run `npm install -g pnpm` in command line

# Installing

1. Clone this repo

   - With Git: `git clone https://github.com/fifomori/chromori`
   - Or [download .zip](https://github.com/fifomori/chromori/archive/refs/heads/main.zip) and unzip it

1. Install dependencies

   - Run `install.bat` (Windows) or `./install.sh` (Linux, macOS)

# Running

1. Run Steam (if you want to collect achievements)
1. Run `app.bat` (Windows) or `./app.sh` (Linux, macOS)
1. Open `http://localhost:8000` in your browser

# Compatibility

- Chrome (tested with 119)
  - works very well
- Firefox (tested with 119)
  - has some sound stutters on synchronus fs operations (mainly in menu)

# OneLoader ![warning](.github/assets/warning.gif)

- doesn't load .zip mods
  - **WORKAROUND: unzip mods**
  - node_stream_zip using fs.open, which is hard to implement without WebSockets
  - TODO: rewrite fs async api to WebSockets
- dosesn't patch xhr requests (fonts, some assets)
  - OneLoader's vfs_web uses the Chrome Extensions API, which is unavailable for regular website
  - **WORKAROUND: replace these assets manually**

# TODO

- Publish prebuilt package
- Build greenworks for linux and darwin
- Test all greenworks binaries
- Autoextract game path while getting key

# Info

- Steamworks SDK version: v1.58a

# OMORI Dedicated Server w/ CapRover
Apparently this is a thing you can do...

**NOTE:** Some changes were made (compared to the original repo) to make the backend/frontend work on more platforms

- Save files are now stored locally (via `localStorage`)
  To import/export a save file, **double click** anywhere on the page
  and follow the prompt.
- Enabled ETag on most endpoints, allowing game assests to be cached.
- Patched [`Native Client` check](https://github.com/Escartem/OmoriSource/blob/453d050c891f365b74063af18169851c857697b1/project/js/plugins/GTP_OmoriFixes.js#L379).TL;DR Older versions of Chrome has it and the game somehow uses this as a predicate to crash itself if detected.
- Patched malformed URL paths, causing some older browsers (and most webservers,actually) to reject those requests
- Patched fixed API endpoints so ports other than 8000 can be used. You can specifiy it in config.json.
- Added Enviroment Variable config feature. The mappings are:

| Environment Variable        | Value                    |
| --------------------------- | ------------------------ |
| CHROMORI_GAME_PATH          | gamePath                 |
| CHROMORI_GAME_DIRECTORY     | gameDirectory            |
| CHROMORI_GAME_KEY           | key                      |
| CHROMORI_GAME_NO_STEAM      | noSteam                  |
| CHROMORI_PORT               | port                     |

Environment variables overrides the config file.
## Game Files
- Setup [SteamCMD](https://developer.valvesoftware.com/wiki/SteamCMD)
- Launch and login with your Steam account that owns OMORI
```bash
steamcmd +@sSteamCmdForcePlatformType windows +login <username> <password>
```
- Install OMORI via `app_update 1150690`
- The game files should be found at `~/.steam/steam/steamcmd/steamapps/OMORI` (assuming `force_install_dir` is not specified)
## chromori Setup 
- Create a CapRover app, add a `Persistent Directories` entry from some path to the actual game file path so the app can access the game files with it
- Configure env `CHROMORI_GAME_PATH` so that the game file path is **the Persistent Directories app entry path**
- Configure env `CHROMORI_GAME_KEY`. You can get [the key](6bdb2e585882fbd48826ef9cffd4c511) by launching `chromori` on your own PC, and get the key from the config.json file it generates
- From `Deployment` tab, Use this repo (with method 3) to initialize the deployment
- That's probably it...
