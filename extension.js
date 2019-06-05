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
const controlCentre = Me.imports.CastControlCentre;

/* 
Global variables for use as button to click 
*/
let castControlButton;

/*
Start services to launch Cast Control platform
*/
function startServices(){
	log("Starting Cast Control services....");
	// Add the panel menu button to the GNOME status area
	Main.panel.addToStatusArea('CastMainMenu', castControlButton, 0, 'right');

	controlCentre.start();

}

function init() {}

function enable() {
	// Init the CastMainMenu which inherits a PanelMenu button
	castControlButton = new mainMenu.CastControl;
	// Start all services & functionality
	startServices();
}

function disable() {
	castControlButton.destroy();	
}