/*
Import Main because is the instance of the class that have all the UI elements
and we have to add to the Main instance our UI elements
*/
const Main = imports.ui.main;

/*
Import CastControl libraries
*/
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const mainMenu = Me.imports.CastMainMenu;

/* Global variables for use as button to click */
let castControlButton;

/*
This is the init function, here we have to put our code to initialize our extension.
we have to be careful with init(), enable() and disable() and do the right things here.
In this case we will do nothing
*/
function init() {}

function enable() {
	/* Create a new object button from class CastMainMenu */
	castControlButton = new mainMenu.CastMainMenu;
	// Add the button to the GNOME status area
	Main.panel.addToStatusArea('CastMainMenu', castControlButton, 0, 'right');
}

function disable() {
	castControlButton.destroy();	
}