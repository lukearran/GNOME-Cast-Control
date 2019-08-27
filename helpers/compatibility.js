const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

// Check if the ExtensionUtils's getSettings function is avaliable,
// otherwise fall back to convenience.js script
function getExtensionUtilsSettings(){
    try{
        this.settings = ExtensionUtils.getSettings('castcontrol.hello.lukearran.com');

        return ExtensionUtils;
    }
    catch{
        return Me.imports.helpers.convenience;
    }
}