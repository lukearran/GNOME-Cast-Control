const Mainloop = imports.mainloop;
const app = "CastControl";

const setTimeout = function(func, millis /* , ... args */) {

    log(app + ": Timer interval has been set to " + millis);

    let args = [];
    if (arguments.length > 2) {
        args = args.slice.call(arguments, 2);
    }
 
    let id = Mainloop.timeout_add(millis, () => {
        func.apply(null, args);
        return false; // Stop repeating
    }, null);

    return id;
};

const clearTimeout = function(id) {
    log(app + ": Timer " + id + " timeout has been cleared");

    Mainloop.source_remove(id);
};

const setInterval = function(func, millis /* , ... args */) {

    log(app + ": Timer interval has been set to " + millis);

    let args = [];
    if (arguments.length > 2) {
        args = args.slice.call(arguments, 2);
    }

    let id = Mainloop.timeout_add(millis, () => {
        func.apply(null, args);        
        return true; // Repeat
    }, null);
    
    return id;
};

const clearInterval = function(id) {

    log(app + ": Timer " + id + " interval has been cleared");

    Mainloop.source_remove(id);
};

