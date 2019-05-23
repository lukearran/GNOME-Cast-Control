// Collection of Now Playing labels by Cast Device ID
var nowPlayingMapTitle = new Map();
var nowPlayingMapSubTitle = new Map();

/* Import St because is the library that allow you to create UI elements */
const St = imports.gi.St;
/* Import Clutter because is the library that allow you to layout UI elements */
const Clutter = imports.gi.Clutter;
/*
Import PanelMenu and PopupMenu 
See more info about these objects in REFERENCE.md
*/
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

// Import libsoup to create HTTP requests
const Soup = imports.gi.Soup;

/*
Import Lang because we will write code in a Object Oriented Manner
*/
const Lang = imports.lang;

var CastMainMenu = new Lang.Class({
	Name: 'CastMainMenu',	// Class Name
	Extends: PanelMenu.Button,	// Parent Class

	_InvokeCastAPI : function(endPoint){
		try{
			log("Attempting to invoke Cast API at " + endPoint);
			// Create a session
			let sessionSync = new Soup.SessionSync();
			// Create a GET message to the API /device
			let msg = Soup.Message.new('GET', 'http://192.168.1.95:3000/' + endPoint);
			// Send the request to the server
			sessionSync.send_message(msg);
			// Parse the response from the server
			var jsonObj = JSON.parse(msg.response_body.data);
			// Convert the JSON response from the server
			return jsonObj;
		}
		catch{
			log("Failed getting the list of connected Cast devices...")
		}
	},
		
	refreshNowPlayingLabels : function(updateSource){
		log("Refreshing Now Playing Labels...");

		// Get the latest device information
		if (updateSource){
			log("Refreshing data source before setting Now Playing Labels...");

			deviceArray = this._InvokeCastAPI("device");
		}

		if (deviceArray != null){
			for (device in deviceArray){
				log("Updating Now Playing label for device " + deviceArray[device].id + "... " + deviceArray[device].status.title);

				// Get the label for the corresponding device id
				var deviceLabelTitle = nowPlayingMapTitle.get(deviceArray[device].id);
				var deviceLabelSubTitle = nowPlayingMapSubTitle.get(deviceArray[device].id);

				let playingLabelTextTitle, playingLabelTextSubTitle;
				
				// If the device is active with media, then update the labels with context
				if (deviceArray[device].status.status != ""){
					// Create the text for the label
					playingLabelTextTitle = deviceArray[device].status.title + " - " + deviceArray[device].status.subtitle;
					playingLabelTextSubTitle = deviceArray[device].status.application;
				}
				// Otherwise inform user that nothing is playing
				else{
					playingLabelTextTitle = "Nothing playing...";
					playingLabelTextSubTitle = "";
				}

				// Set the text back to the label
				deviceLabelTitle.set_text(playingLabelTextTitle);
				deviceLabelSubTitle.set_text(playingLabelTextSubTitle);

			}		
		}
	},

		// Requests the list of all device items from the server, and creates
	// a menu item for each device
	_addCastDeviceMenuItems : function(){
		// Create an array of Cast Devices
		deviceArray = this._InvokeCastAPI("device");

		// If the request to the server does return an object, then create the app menu items
		if (deviceArray != null){
			// Loop through each item in the array
			for (device in deviceArray){
				// Create a submenu for each device item
                let deviceMenuExpander = 
                    new PopupMenu.PopupSubMenuMenuItem(
                        deviceArray[device].name)
				// Under each sub-menu, show controls
				// Current Application running on Cast Device
				let labelMediaApp = new St.Label({text:deviceArray[device].status.application + ' - ' + deviceArray[device].status.title});
				let labelMediaAppSubtitle = new St.Label({text:"Loading..."});

				// To access the label upon refreshing, add the label to a key collection with the device ID
				nowPlayingMapTitle.set(deviceArray[device].id, labelMediaApp);
				nowPlayingMapSubTitle.set(deviceArray[device].id, labelMediaAppSubtitle);

				// Add the sub-menu items to the parent menu item
				deviceMenuExpander.menu.box.add(nowPlayingMapTitle.get(deviceArray[device].id));
				deviceMenuExpander.menu.box.add(nowPlayingMapSubTitle.get(deviceArray[device].id));
				deviceMenuExpander.menu.box.style_class = 'PopupSubMenuMenuItemStyle';

				let playMenuItem = new PopupMenu.PopupImageMenuItem('Play', 'media-playback-start-symbolic');
				let pauseMenuItem = new PopupMenu.PopupImageMenuItem('Pause', 'media-playback-pause-symbolic');
				let muteMenuItem = new PopupMenu.PopupImageMenuItem('Mute', 'audio-volume-muted-symbolic');

				deviceMenuExpander.menu.addMenuItem(playMenuItem);
				deviceMenuExpander.menu.addMenuItem(pauseMenuItem);
				deviceMenuExpander.menu.addMenuItem(muteMenuItem);

				// Add the parent menu to the Indicator menu
				this.menu.addMenuItem(deviceMenuExpander);

				playMenuItem.connect('activate', Lang.bind(this, function(){
					this._InvokeCastAPI("device/" + deviceArray[device].id + "/play");
				}));

				pauseMenuItem.connect('activate', Lang.bind(this, function(){
					this._InvokeCastAPI("device/" + deviceArray[device].id + "/pause");
				}));
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

    populateMenuItems: function(){
        // Create a refresh button
        let refreshMenuItem = new PopupMenu.PopupImageMenuItem('Refresh', 'view-refresh-symbolic');		

        // Assemble all menu items
        // Get Cast Device Menu
        this._addCastDeviceMenuItems();
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(refreshMenuItem);

        // Connect the Refresh menu item to a click event trigger
        refreshMenuItem.connect('activate', Lang.bind(this, function(){
			this.refreshNowPlayingLabels(true);
        }));
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
		let icon =  new St.Icon({ icon_name: 'preferences-desktop-remote-desktop-symbolic', style_class: 'system-status-icon'});

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
        
        // Populate the menu items
        this.populateMenuItems();

	},

	destroy: function() {
		resetButton();
	}
});