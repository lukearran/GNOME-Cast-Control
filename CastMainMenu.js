// Import St because is the library that allow you to create UI elements
const St = imports.gi.St;
// Import Clutter because is the library that allow you to layout UI elements
const Clutter = imports.gi.Clutter;
// Import Gio to store and return setting values
const Gio = imports.gi.Gio;
//Import PanelMenu and PopupMenu 
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;
//Import libsoup to create HTTP requests
const Soup = imports.gi.Soup;
//Import Lang because we will write code in a Object Oriented Manner
const Lang = imports.lang;
// Import Helper classes
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Timers = Me.imports.helpers.timers;
// Collection of Now Playing labels by Cast Device ID
var nowPlayingMapTitle = new Map();
var nowPlayingMapSubTitle = new Map();
// Refresh settings
var _refreshInterval;
// Settings
let schema, settings, settingChangesId, apiHostname, apiPort, sessionSync;

var CastControl = new Lang.Class({
	Name: 'CastControl',	// Class Name
	Extends: PanelMenu.Button,	// Parent Class
	
	_InvokeCastAPI : function(endPoint, requestType){
		var requestId = Math.random();

		try{
			// Cancel any pending/ongoing connections before creating a new one
			this.sessionSync.abort();

			if (this.apiHostname.length > 0 && this.apiPort > 0){
				// Create the base address from the settings
				var baseAddress = "http://" + this.apiHostname + ":" + this.apiPort;
				// Write to log
				log(requestType + " Request Started #" + requestId + " to Cast API at " + baseAddress + "/" + endPoint);
				// Create a GET message to the API /device
				let request = Soup.Message.new(requestType.toUpperCase(), baseAddress + "/" + endPoint);
				// Send the request to the server
				this.sessionSync.send_message(request);
				// Parse the response from the server
				var jsonObj = JSON.parse(request.response_body.data);

				log(requestType + " Request Finished #" + requestId + ".");

				// Convert the JSON response from the server
				return jsonObj;
			}
			else{
				throw "Invalid hostname or port setting value of requesting Cast API";
			}
		}
		catch (error){
			log("Request Failed #" + requestId + ": Failed to get the list of connected Cast devices - is the Cast Web API running at " 
					+ this.apiHostname + ":" + this.apiPort + ": " + error);
		}
	},
		
	refreshNowPlayingLabels : function(updateSource){

		// Get the latest device information
		if (updateSource){
			deviceArray = this._InvokeCastAPI("device", "GET");
		}

		// Refresh the Now Playing labels if the device array is not empty
		if (deviceArray != null && deviceArray.length > 0){
			// Loop through each device
			for (device in deviceArray){
				log("Updating context label for device " + deviceArray[device].id + "... " + deviceArray[device].status.title);

				// Get the title label assigned to the corresponding menu label
				var deviceLabelTitle = nowPlayingMapTitle.get(deviceArray[device].id);
				// Get the sub-title title label assigned to the corresponding menu label
				var deviceLabelSubTitle = nowPlayingMapSubTitle.get(deviceArray[device].id);

				// Declare variables to store the string for the labels
				let playingLabelTextTitle, playingLabelTextSubTitle;

				// Ensure the Status member contains a string, and is not the default application of Nest Hub / Chromecast
				if (deviceArray[device].status.application.length > 0 && deviceArray[device].status.application != "Backdrop"){					
					// Ensure the title member contains a value and is present
					if (deviceArray[device].status.title != null && deviceArray[device].status.title.length > 0){
						playingLabelTextTitle = deviceArray[device].status.title;

						if (deviceArray[device].status.subtitle != undefined && deviceArray[device].status.subtitle.length > 0){
							playingLabelTextTitle += " - " + deviceArray[device].status.subtitle;
						}

						playingLabelTextSubTitle = deviceArray[device].status.application;
					}
					// Otherwise just display the application
					else{
						playingLabelTextTitle = "Now Playing";
						playingLabelTextSubTitle = deviceArray[device].status.application;
					}
				}
				else{
					playingLabelTextTitle = "Nothing playing...";
					playingLabelTextSubTitle = "";
				}

				// Set the string to the label object text
				deviceLabelTitle.set_text(playingLabelTextTitle);
				deviceLabelSubTitle.set_text(playingLabelTextSubTitle);

			}		
		}
	},

	
	_clearMenuItems : function(){
		this.menu.removeAll();
	},

	// Create device menu action triggers
	_hookUpActionTriggers : function(menuItem, deviceId, action){
		menuItem.connect('activate', Lang.bind(this, function(){
			this._InvokeCastAPI("device/" + deviceId + "/" + action, "GET");
		}));
	},

	_hookUpMuteSwitchTriggers : function (switchItem, deviceId){
		switchItem.connect('toggled', Lang.bind(this, function(object, value){
			if (value){
				// We will just change the text content of the label
				this._InvokeCastAPI("device/" + deviceId + "/" + "muted/true", "GET");
			}
			else{
				this._InvokeCastAPI("device/" + deviceId + "/" + "muted/false", "GET");
			}
		}));
	},

	// Requests the list of all device items from the server, and creates
	// a menu item for each device
	_addCastDeviceMenuItems : function(){
		try{
			// We are creating a box layout with shell toolkit
			let deviceTray = new St.BoxLayout();

			// Get the list of Cast devices from the API
			// Store the device items in the array
			deviceArray = this._InvokeCastAPI("device", "GET");

			// Proceed if the device array is not empty
			if (deviceArray != null && deviceArray.length > 0){

				// For every device item in the array, complete the following statement
				for (device in deviceArray){
					// Create a parent sub-menu
					let deviceMenuExpander = 
						new PopupMenu.PopupSubMenuMenuItem(
							deviceArray[device].name);

					// Create the title labels
					let labelMediaApp = new St.Label({text:"Loading..."});
					let labelMediaAppSubtitle = new St.Label({text:"Loading..."});

					// To refresh the labels at a later point, map the label object to the device ID
					nowPlayingMapTitle.set(deviceArray[device].id, labelMediaApp);
					nowPlayingMapSubTitle.set(deviceArray[device].id, labelMediaAppSubtitle);

					// Add the title and sub-title to the box
					deviceMenuExpander.menu.box.add(nowPlayingMapTitle.get(deviceArray[device].id));
					deviceMenuExpander.menu.box.add(nowPlayingMapSubTitle.get(deviceArray[device].id));

					// Set the stylesheet which applies a margin to the label
					deviceMenuExpander.menu.box.style_class = 'PopupSubMenuMenuItemStyle';

					// Create a Play Menu Item
					let playMenuItem = new PopupMenu.PopupImageMenuItem('Play', 'media-playback-start-symbolic');
					deviceMenuExpander.menu.addMenuItem(playMenuItem);

					// Create a Pause Menu Item
					let pauseMenuItem = new PopupMenu.PopupImageMenuItem('Pause', 'media-playback-pause-symbolic');
					deviceMenuExpander.menu.addMenuItem(pauseMenuItem);

					// Create a Stop Menu Item
					let stopMenuItem = new PopupMenu.PopupImageMenuItem('Stop', 'media-playback-stop-symbolic');
					deviceMenuExpander.menu.addMenuItem(stopMenuItem);				

					// Mute Switch
					let muteSwitchItem = new PopupMenu.PopupSwitchMenuItem('Mute');
					deviceMenuExpander.menu.addMenuItem(muteSwitchItem);


					if(deviceArray[device].status.muted){
						muteSwitchItem.toggle();
					}

					// Add this device drop-down menu to the parent menu
					this.menu.addMenuItem(deviceMenuExpander);

					// Connect event triggers to the media control buttons
					this._hookUpActionTriggers(playMenuItem, deviceArray[device].id, "play");
					this._hookUpActionTriggers(pauseMenuItem, deviceArray[device].id, "pause");
					this._hookUpActionTriggers(stopMenuItem, deviceArray[device].id, "stop");
					this._hookUpMuteSwitchTriggers(muteSwitchItem, deviceArray[device].id);
					
				}

				// Once the labels have been created, refresh them once more
				this.refreshNowPlayingLabels(false);
			}
			// Otherwise show a menu item indicating that the is no devices
			else{
				let noItemsFoundMenu = new PopupMenu.PopupMenuItem("No devices found...");
				this.menu.addMenuItem(noItemsFoundMenu);
			}
		}
		catch (menuExp){
			// Remove all items in the menu list
			this._clearMenuItems();
			// Show error menu
			let noItemsFoundMenu = new PopupMenu.PopupMenuItem("A problem occurred...");
			this.menu.addMenuItem(noItemsFoundMenu);
			// Add to log
			log("An error occurred on adding items to the menu. Reverting to error view: " + menuExp);
		}
	},

	_setupRefreshInterval: function(interval){
		if (interval >= 1000){
			log("Cast API Refresh Interval Trigger set at interval " + interval + "ms...");

			this._refreshInterval = Timers.setInterval(() => {
				if (!this.menu.isOpen){

					this._createMenuItems();

					log("Cast extension is now refreshed with API... waiting until next " + interval + "ms");

				}
				else{
					log("Cast API extension was not refreshed as menu is currently open. Wait until menu is closed....");
				}
			}, interval);
		}
		else{
			throw "refresh interval has to be greater than 3000ms";
		}
	},

    _createMenuItems: function(){
        // Create a refresh button
		let refreshMenuItem = new PopupMenu.PopupImageMenuItem('Refresh', 'view-refresh-symbolic');
		
		// Set a fixed width to the menu to ensure consistency
		this.menu.box.width = 350;

		// Clear menu items, if items have already been created
		this._clearMenuItems();

        // Create menu item for each Cast device
		this._addCastDeviceMenuItems();
		// Add a separator between the device list and the refresh button
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		// Add the refresh button
		this.menu.addMenuItem(refreshMenuItem);

        // Hook up the refresh menu button to a click trigger, which will call the refresh method
        refreshMenuItem.connect('activate', Lang.bind(this, function(){
			this._createMenuItems();
		}));
	},

	// Constructor
	_init: function() {

		// Get the Setting's schema
		this.schema = Gio.SettingsSchemaSource.new_from_directory(
			Me.dir.get_child('schemas').get_path(),
			Gio.SettingsSchemaSource.get_default(),
			false
		);

		// Load the schema values
		this.settings = new Gio.Settings({
			settings_schema: this.schema.lookup('castcontrol.hello.lukearran.com', true)
		});

		// Get Setting Config
		var refreshIntervalSetting = this.settings.get_value("refresh-interval-ms").deep_unpack();
		this.apiHostname = this.settings.get_value("castapi-hostname").deep_unpack();
		this.apiPort = this.settings.get_value("castapi-port").deep_unpack();

		// Setup a Soup Session
		this.sessionSync = new Soup.SessionSync();
		this.sessionSync.max_conns = 1;

		// Setup background refresh with the interval value
		this._setupRefreshInterval(refreshIntervalSetting);
		
		/* 
		This is calling the parent constructor
		1 is the menu alignment (1 is left, 0 is right, 0.5 is centered)
		`CastMainMenu` is the name
		true if you want to create a menu automatically, otherwise false
		*/
		this.parent(1, 'CastMainMenu', false);

		// We are creating a box layout with shell toolkit
		let box = new St.BoxLayout();

		/*
		All icons are found in `/usr/share/icons/theme-being-used`
		*/
		let icon =  new St.Icon({ icon_name: 'user-home-symbolic', style_class: 'system-status-icon'});

		// A label expanded and center aligned in the y-axis
		let toplabel = new St.Label({ text: ' Home ',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER });

		// We add the icon, the label and a arrow icon to the box
		box.add(icon);
		box.add(toplabel);
		box.add(PopupMenu.arrowIcon(St.Side.BOTTOM));

		// We add the box to the button
		// It will be showed in the Top Panel
		this.actor.add_child(box);
		
        // Create the drop-down menu items
		this._createMenuItems();

	},

	destroy: function() {
		Timers.clearInterval(this._refreshInterval);
		this.parent();
	}
});
