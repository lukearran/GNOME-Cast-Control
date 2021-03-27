# Google Cast Control for GNOME Shell

![screenshot](https://raw.githubusercontent.com/SamyGarib/GNOME-Cast-Control/master/screen-shot-v2.png)

> NOTICE: This extension is no longer being actively maintained. It's likely that the extension may break in a future GNOME Shell release. If you wish to take over the repository then please open an issue on the GitHub repository.

A simple GNOME extension client for [vervallsweg's Cast Web API Node application](https://github.com/vervallsweg/cast-web-api-cli) - control the playback of Google Cast devices from the GNOME shell.

## Features / To Do List

- [X] Play / Resume
- [X] Stop
- [X] Mute Toggle
- [X] Auto Refresh
- [X] Change Cast API Port
- [X] Settings / Setup Wizard
- [X] Automatically start Cast Web API on the extension being created
- [X] Control Device Volume. (v2)
- [ ] Bundle cast-web-api-cli into an installable Snap package
- [X] Display Now Playing Media Images (v2)
- [X] Display Device Status in the List (v2)

## Requirements

* GNOME Shell >= 3.32
* [Node.JS application 'cast-web-api-cli'](https://github.com/lukearran/cast-web-api-cli)

## Automatic Installation via GNOME Extension site

1. [Install the Node.JS application 'cast-web-api-cli'](https://github.com/lukearran/cast-web-api-cli)
    1. sudo apt-get install npm
    2. sudo npm install cast-web-api-cli -g
2. [Install the extension via GNOME](https://extensions.gnome.org/extension/1955/cast-control/)
3. Wait up to 5 minutes for cast-web-api-cli to start and locate devices in your local network.
4. Enjoy!

## Manual Installation via GitHub

1. [Install the Node.JS application 'cast-web-api-cli'](https://github.com/lukearran/cast-web-api-cli)
    1. sudo apt-get install npm
    2. sudo npm install cast-web-api-cli -g
2. Git Clone or download a zip of this repository and extract to the root directory of *'~/.local/share/gnome-shell/extensions/castcontrol@hello.lukearran.com'* (create the directory if it does not exists)
3. Restart your desktop, or GNOME Shell
4. Enable "Cast Control" in the GNOME Tweaks Tool
5. Wait up to 5 minutes for cast-web-api-cli to detect devices in your local network 
6. Enjoy
