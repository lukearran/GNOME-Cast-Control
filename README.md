# Google Cast Control for GNOME Shell

![screenshot](https://raw.githubusercontent.com/lukearran/castcontrol-hello.lukearran.com/master/screenshot.png)

A simple GNOME extension client for [vervallsweg's Cast Web API Node application](https://github.com/vervallsweg/cast-web-api-cli)  - control the playback of Google Cast devices on a local network directly from the GNOME shell.

Please note that the extension is currently still in an early **ALPHA** stage. I started this project as a personal pet project, with no experience of creating GNOME extensions / apps, so the project requires substantial polish before being published to a wider user base on https://extensions.gnome.org/

Please do get involved! I'm intending to develop this further to include the below features.

## Features / To Do List

- [X] Play / Resume
- [X] Stop
- [ ] Rewind / Fast forward 30 Seconds
- [X] Auto Refresh
- [ ] Change Cast API Port
- [ ] Settings / Setup Wizard
- [X] Automatically starts Cast Web API on the extension being created
- [ ] Embed [vervallsweg's Cast Web API Node application](https://github.com/vervallsweg/cast-web-api-cli) natively into extension
- [ ] Display Now Playing Media Images

## Installation

- Install [vervallsweg's Cast Web API Node application](https://github.com/vervallsweg/cast-web-api-cli) on your GNOME based Linux distribution.
- Download the source code, and extract the contents to ~/.local/share/gnome-shell/extensions/castcontrol-hello.lukearran.com
- After extracting the contents to the folder, restart the GNOME Shell. Go to GNOME Tweak Tool and enable "Cast Control"
- It may take up to 5 minutes for Cast Web API to start and search devices.