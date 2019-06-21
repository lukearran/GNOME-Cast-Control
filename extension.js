const Main = imports.ui.main;
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

	// Start Cast Web API CLI from Terminal
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
	controlCentre.stop();
	castControlButton.destroy();	
	castControlButton = null;
}