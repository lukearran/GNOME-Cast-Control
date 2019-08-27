const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const mainMenu = Me.imports.CastMainMenu;
const controlCentre = Me.imports.CastControlCentre;
const compat = Me.imports.helpers.compatibility;
const Gio = imports.gi.Gio;

let castControlButton;

// Check if the extension should start / stop the API
function isAutoControlEnabled(){
	// Load the schema values
	this.settings = this.compat.getExtensionUtilsSettings().getSettings('castcontrol.hello.lukearran.com');
	// Get Setting Config
	return this.settings.get_boolean("auto-castapi");
}

/*
Start services to launch Cast Control platform
*/
function startServices(){
	// Add the panel menu button to the GNOME status area
	Main.panel.addToStatusArea('CastMainMenu', castControlButton, 0, 'right');

	if (this.isAutoControlEnabled()){
		// Start Cast Web API CLI from Terminal
		controlCentre.start();
	}

}

function init() {
	log(`Initializing ${Me.metadata.name} ${Me.metadata.version}`);
}

function enable() {
	// Init the CastMainMenu which inherits a PanelMenu button
	castControlButton = new mainMenu.CastControl;
	// Start all services & functionality
	startServices();
}

function disable() {
	if (this.isAutoControlEnabled()){
		controlCentre.stop();
	}

	castControlButton.destroy();	
	castControlButton = null;
}
