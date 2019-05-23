/* Import St because is the library that allow you to create UI elements */
const St = imports.gi.St;
/* Import Clutter because is the library that allow you to layout UI elements */
const Clutter = imports.gi.Clutter;
// Import libsoup to create HTTP requests
const Soup = imports.gi.Soup;

/*
Import Main because is the instance of the class that have all the UI elements
and we have to add to the Main instance our UI elements
*/
const Main = imports.ui.main;

/*
Import PanelMenu and PopupMenu 
See more info about these objects in REFERENCE.md
*/
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

/*
Import Lang because we will write code in a Object Oriented Manner
*/
const Lang = imports.lang;

/* Global variables for use as button to click */
let button, deviceArray;

// Refresh the menu items
function resetButton(){
	button.destroy();
}


function GetCastDevices(){
	try{
		log("Attempting to get Cast devices...");
		// Create a session
		let sessionSync = new Soup.SessionSync();
		// Create a GET message to the API /device
		let msg = Soup.Message.new('GET', 'http://192.168.1.95:3000/device/');
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
}

// Requests the list of all device items from the server, and creates
// a menu item for each device
function addCastDeviceMenuItems(_menu){
	// Create an array of Cast Devices
	deviceArray = GetCastDevices();

	// If the request to the server does return an object, then create the app menu items
	if (deviceArray != null){
		// Loop through each item in the array
		for (device in deviceArray){
			// Create a submenu for each device item
			let deviceMenuExpander = new PopupMenu.PopupSubMenuMenuItem(deviceArray[device].name)
			// Under each sub-menu, show controls
			let deviceMenu_MediaApp = new PopupMenu.PopupSubMenuMenuItem(deviceArray[device].status.application + ' - ' + deviceArray[device].status.title);

			// Add the sub-menu items to the parent menu item
			deviceMenuExpander.menu.addMenuItem(deviceMenu_MediaApp);
			// Add the parent menu to the app menu
			_menu.addMenuItem(deviceMenuExpander);
		}
	}
	// Otherwise show a menu item indicating that the is no devices
	else{
		let noItemsFoundMenu = new PopupMenu.PopupMenuItem("No cast devices found...");
		_menu.addMenuItem(noItemsFoundMenu);
	}
}

const CastMainMenu = new Lang.Class({
	Name: 'CastMainMenu',	// Class Name
	Extends: PanelMenu.Button,	// Parent Class

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
		
		// Create a refresh button
		let refreshMenuItem = new PopupMenu.PopupImageMenuItem('Refresh', 'view-refresh-symbolic');		

		// Assemble all menu items
		addCastDeviceMenuItems(this.menu);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.menu.addMenuItem(refreshMenuItem);

		// Connect the Refresh menu item to a click event trigger
		refreshMenuItem.connect('activate', Lang.bind(this, function(){
			
		}));
	},

	destroy: function() {
		resetButton();
	}
});

/*
This is the init function, here we have to put our code to initialize our extension.
we have to be careful with init(), enable() and disable() and do the right things here.
In this case we will do nothing
*/
function init() {}


function enable() {
	/* Create a new object button from class CastMainMenu */
	button = new CastMainMenu;
	// Add the button to the GNOME status area
	Main.panel.addToStatusArea('CastMainMenu', button, 0, 'right');
}


function disable() {
	button.destroy();	
}