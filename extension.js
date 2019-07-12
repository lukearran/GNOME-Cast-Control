const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const mainMenu = Me.imports.CastMainMenu;
const controlCentre = Me.imports.CastControlCentre;
const Gio = imports.gi.Gio;

/* 
Global variables for use as button to click 
*/
let castControlButton;

// Check if the extension should start / stop the API
function isAutoControlEnabled(){
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
	return this.settings.get_value("auto-castapi").deep_unpack();
}

/*
Start services to launch Cast Control platform
*/
function startServices(){
	log("Starting Cast Control services....");

	// Add the panel menu button to the GNOME status area
	Main.panel.addToStatusArea('CastMainMenu', castControlButton, 0, 'right');

	if (this.isAutoControlEnabled()){
		// Start Cast Web API CLI from Terminal
		controlCentre.start();
	}

}

function init() {}

function enable() {
	// Init the CastMainMenu which inherits a PanelMenu button
	castControlButton = new mainMenu.CastControl;
	// Start all services & functionality
	startServices();
}

function disable() {
	if (this.isAutoControlEnabled){
		controlCentre.stop();
	}

	castControlButton.destroy();	
	castControlButton = null;
}
