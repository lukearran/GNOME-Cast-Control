const GLib = imports.gi.GLib;
const util = imports.misc.util;

// trySpawnCommandLine:
// @command_line: a command line
//
// Runs @command_line in the background. If launching @command_line
// fails, this will throw an error.
function trySpawnCommandLine(command_line) {
    let success, argv;

    try {
        [success, argv] = GLib.shell_parse_argv(command_line);
    } catch (err) {
        // Replace "Error invoking GLib.shell_parse_argv: " with
        // something nicer
        err.message = err.message.replace(/[^:]*: /, _("Could not parse command:") + "\n");
        throw err;
    }
    log(success);
    util.trySpawn(argv);
}


function start(){    
    trySpawnCommandLine("cast-web-api-cli start");
}

function stop(){
    trySpawnCommandLine("cast-web-api-cli stop");
}