const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Timers = Me.imports.helpers.timers;
const compat = Me.imports.helpers.compatibility;


const logMeta = (`${Me.metadata.name} ${Me.metadata.version}: `);

var _signals;
// Refresh settings
var _refreshInterval;
// HTTP Communication Settings
let sessionSync, settings, settingChangesId, apiHostname, apiPort;

var CastControl = new Lang.Class({
	Name: 'CastControl',	// Class Name
	Extends: PanelMenu.Button,	// Parent Class
	
	_InvokeCastAPI : function(endPoint, requestType, callback){
		try{
			// Cancel any pending/ongoing connections before creating a new one
			this.sessionSync.abort();

			if (this.apiHostname.length > 0 && this.apiPort > 0){
				// Create the base address from the settings
				var baseAddress = "http://" + this.apiHostname + ":" + this.apiPort;
				// Write to log
				log(logMeta + requestType + " Request Started to Cast API at " + baseAddress + "/" + endPoint);
				// Create a GET message to the API /device
				let request = Soup.Message.new(requestType.toUpperCase(), baseAddress + "/" + endPoint);

				// Send the request to the server
				this.sessionSync.queue_message(request, Lang.bind(this, function() {
					// Parse the response from the server
					var response = JSON.parse(request.response_body.data);
					
					if (typeof callback !== "undefined"){
						// Pass the data onto the callback function
						callback(response, this);
					}

				}));
			}
			else{
				throw "Invalid hostname or port setting value of requesting Cast API";
			}
		}
		catch (error){
			log(logMeta + "Request Failed #" + requestId + ": Failed to get the list of connected Cast devices - is the Cast Web API running at " 
					+ this.apiHostname + ":" + this.apiPort + ": " + error);
		}
	},

	_getDeviceHeading : function(_device){
		// Refresh the Now Playing labels if the device array is not empty
		if (_device != null){
			// Declare variables to store the string for the labels
			var playingLabelTextTitle, playingLabelTextSubTitle;

			// Ensure the Status member contains a string, and is not the default application of Nest Hub / Chromecast
			if (_device.status.application.length > 0 && _device.status.application != "Backdrop"){					
				// Ensure the title member contains a value and is present
				if (_device.status.title != null && _device.status.title.length > 0){
					playingLabelTextTitle = _device.status.title;

					if (_device.status.subtitle != undefined && _device.status.subtitle.length > 0){
						playingLabelTextTitle += " - " + _device.status.subtitle;
					}

					playingLabelTextSubTitle = _device.status.application;
				}
				// Otherwise just display the application
				else{
					playingLabelTextTitle = "Now Playing";
					playingLabelTextSubTitle = _device.status.application;
				}
			}
			else{
				playingLabelTextTitle = "Nothing playing...";
				playingLabelTextSubTitle = "";
			}
		}

		return new Array(playingLabelTextTitle, playingLabelTextSubTitle);
	},

	// Requests the list of all device items from the server, and creates
	// a menu item for each device
	_addCastDeviceMenuItems : function(_source, base){
		try{
			if (_source != null && _source.length > 0){
				for (device in _source){
					// Create a parent sub-menu
					let deviceMenuExpander = new PopupMenu.PopupSubMenuMenuItem(_source[device].name);

					// Create the title labels
					let labelMediaApp = new St.Label(
						{
							text: base._getDeviceHeading(_source[device])[0]
						});
					let labelMediaAppSubtitle = new St.Label(
						{
							text: base._getDeviceHeading(_source[device])[1]
						});

					// Add the title and sub-title to the box
					deviceMenuExpander.menu.box.add(labelMediaApp);
					deviceMenuExpander.menu.box.add(labelMediaAppSubtitle);

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


					if(_source[device].status.muted){
						muteSwitchItem.toggle();
					}

					// Add this device drop-down menu to the parent menu
					base.menu.addMenuItem(deviceMenuExpander);

					// Connect event triggers to the media control buttons
					base._hookUpActionTriggers(playMenuItem, _source[device].id, "play", base);
					base._hookUpActionTriggers(pauseMenuItem, _source[device].id, "pause", base);
					base._hookUpActionTriggers(stopMenuItem, _source[device].id, "stop", base);
					base._hookUpMuteSwitchTriggers(muteSwitchItem, _source[device].id, base);	
				}
			}
			// Otherwise show a menu item indicating that the is no devices
			else{
				let noItemsFoundMenu = new PopupMenu.PopupMenuItem("No devices found...");
				base.menu.addMenuItem(noItemsFoundMenu);
			}
		}
		catch (menuExp){
			//Remove all items in the menu list
			base._clearMenuItems();
			//Show error menu
			let noItemsFoundMenu = new PopupMenu.PopupMenuItem("An error occurred...");
			base.menu.addMenuItem(noItemsFoundMenu);
			//Add to log
			log(logMeta + "An error occurred on adding items to the menu. Reverting to error view: " + menuExp);
		}

		// Create a refresh button
		let refreshMenuItem = new PopupMenu.PopupImageMenuItem('Refresh', 'view-refresh-symbolic');
		// Add a separator between the device list and the refresh button
		base.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		// Add the refresh button
		base.menu.addMenuItem(refreshMenuItem);

		// Hook up the refresh menu button to a click trigger, which will call the refresh method
		base._createNewSignalId(refreshMenuItem, 
			refreshMenuItem.connect('activate', Lang.bind(this, function(){
				base._createMenuItems();
		})));
	},

	_setupRefreshInterval: function(interval){
		if (interval >= 1000){
			log(logMeta + "Cast API Refresh Interval Trigger set at interval " + interval + "ms...");

			this._refreshInterval = Timers.setInterval(() => {
				if (!this.menu.isOpen){

					this._createMenuItems();

					log(logMeta + "Now refreshed with API... waiting until next " + interval + "ms");

				}
				else{
					log(logMeta + "Unable to refresh as menu is currently open. Refresh will only trigger when menu is closed.");
				}
			}, interval);
		}
		else{
			throw "refresh interval has to be greater than 3000ms";
		}
	},

	_clearMenuItems : function(){
		this._dropAllSignals();
		this.menu.removeAll();
	},

	// Create device menu action triggers
	_hookUpActionTriggers : function(menuItem, deviceId, action, base){
			this._createNewSignalId(menuItem, menuItem.connect('activate', Lang.bind(this, function(){
				// Confusingly, the API uses a GET HTTP type for actions
				this._InvokeCastAPI("device/" + deviceId + "/" + action, "GET");
		})));
	},

	_hookUpMuteSwitchTriggers : function (switchItem, deviceId, base){
		this._createNewSignalId(switchItem, switchItem.connect('toggled', Lang.bind(this, function(object, value){
			if (value){
				// Confusingly, the API uses a GET HTTP type for actions
				this._InvokeCastAPI("device/" + deviceId + "/" + "muted/true", "GET");
			}
			else{
				this._InvokeCastAPI("device/" + deviceId + "/" + "muted/false", "GET");
			}
		})));
	},

    _createMenuItems: function(){
		// Set a fixed width to the menu to ensure consistency
		this.menu.box.width = 350;
		// Clear menu items, if items have already been created
		this._clearMenuItems();
        // Create menu item for each Cast device
		this._InvokeCastAPI("device", "GET", this._addCastDeviceMenuItems);
	},

	_createNewSignalId(object, signal){
		var signal = {
			"source" : object,
			"signal" : signal
		};

		this._signals.push(signal);
	},

	_dropAllSignals(){
		for (let index = 0; index < this._signals.length; index++) {
			const element = this._signals[index];
			element.source.disconnect(element.signal);
		}

		this._signals = new Array();
	},

	// Constructor
	_init: function() {
		this.sessionSync = new Soup.SessionAsync();

		this._signals = new Array();

		// Load the schema values

		this.settings = compat.getExtensionUtilsSettings().getSettings('castcontrol.hello.lukearran.com');

		// Get Setting Config
		var refreshIntervalSetting = this.settings.get_int("refresh-interval-ms");
		this.apiHostname = this.settings.get_string("castapi-hostname");
		this.apiPort = this.settings.get_int("castapi-port");

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
		// Clear the timer
		Timers.clearInterval(this._refreshInterval);

		// Disconnect signals
		this._dropAllSignals();

		// Destroy objects
		this._refreshInterval = null;
		this.sessionSync = null;
		this.settings = null;
		this.settingChangesId = null;
		this.apiHostname = null;
		this.apiPort = null;
		this._signals = null;

		this.parent();
	}
});
