// Import St because is the library that allow you to create UI elements
const St = imports.gi.St;
// Import Clutter because is the library that allow you to layout UI elements
const Clutter = imports.gi.Clutter;
//Import PanelMenu and PopupMenu 
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
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

let _refreshInterval;

var CastControl = new Lang.Class({
	Name: 'CastControl',	// Class Name
	Extends: PanelMenu.Button,	// Parent Class
	
	_InvokeCastAPI : function(endPoint){
		try{
			log("Attempting to invoke the Legacy HTTP Cast API at " + endPoint);
			// Create a session
			let sessionSync = new Soup.SessionSync();
			// Create a GET message to the API /device
			let msg = Soup.Message.new('GET', 'http://localhost:3000/' + endPoint);
			// Send the request to the server
			sessionSync.send_message(msg);
			// Parse the response from the server
			var jsonObj = JSON.parse(msg.response_body.data);
			// Convert the JSON response from the server
			return jsonObj;
		}
		catch{
			log("Failed to get the list of connected Cast devices - is the Cast Web API running on port 3000?...")
		}
	},
		
	refreshNowPlayingLabels : function(updateSource){
		// Get the latest device information
		if (updateSource)
			deviceArray = this._InvokeCastAPI("device");

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
				
				// If the status of the device is not empty, then the device will be playing content
				if (deviceArray[device].status.status != ""){
					// Create the string for the title
					playingLabelTextTitle = deviceArray[device].status.title + " - " + deviceArray[device].status.subtitle;
					// Create the string for the sub-title
					playingLabelTextSubTitle = deviceArray[device].status.application;
				}
				// Otherwise inform user that nothing is playing right now...
				else{
					playingLabelTextTitle = "Nothing is playing...";
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
			this._InvokeCastAPI("device/" + deviceId + "/" + action);
		}));
	},

	_hookUpMuteSwitchTriggers : function (switchItem, deviceId){
		switchItem.connect('toggled', Lang.bind(this, function(object, value){
			if (value){
				// We will just change the text content of the label
				this._InvokeCastAPI("device/" + deviceId + "/" + "muted/true");
			}
			else{
				this._InvokeCastAPI("device/" + deviceId + "/" + "muted/false");
			}
		}));
	},

	// Requests the list of all device items from the server, and creates
	// a menu item for each device
	_addCastDeviceMenuItems : function(){
		// We are creating a box layout with shell toolkit
		let deviceTray = new St.BoxLayout();

		// Get the list of Cast devices from the API
		// Store the device items in the array
		deviceArray = this._InvokeCastAPI("device");

		// Proceed if the device array is not empty
		if (deviceArray != null && deviceArray.length > 0){

			// For every device item in the array, complete the following statment
			for (device in deviceArray){
				// Create a parent sub-menu
                let deviceMenuExpander = 
                    new PopupMenu.PopupSubMenuMenuItem(
						deviceArray[device].name)

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
			let noItemsFoundMenu = new PopupMenu.PopupMenuItem("No cast devices found...");
			this.menu.addMenuItem(noItemsFoundMenu);
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
		
		this._refreshInterval = Timers.setInterval(() => {
			this._createMenuItems();
			Timers.clearInterval(this._refreshInterval);
		}, 60000);
	},

	// Constructor
	_init: function() {
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
		let icon =  new St.Icon({ icon_name: 'video-display-symbolic', style_class: 'system-status-icon'});

		// A label expanded and center aligned in the y-axis
		let toplabel = new St.Label({ text: ' Cast ',
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
		resetButton();
		Timers.clearInterval(this._refreshInterval);
	}
});
