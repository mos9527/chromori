/// <reference path="intellisense.d.ts"/>
// Patching SDK Check
window.navigator.plugins.namedItem = function (name) {
    return null;
}

// Patching XHR FS
let XMLHttpRequest_prototype_open = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function() {
    // method, url, async, user, password    
    let url = arguments[1];
    // characters like $ might trigger 400s on some webservers
    // put them in a header instead
    if (arguments[1].includes("$")) arguments[1] = "fallback";
    XMLHttpRequest_prototype_open.apply(this, arguments);
    // always append the header afterwards    
    this.setRequestHeader("x-fs-path", url);
}

// Save file Import/Export
document.addEventListener("dblclick", (evt) => {
    let fname = window.prompt("Save file name (e.g. global.rpgsave, file1.rpgsave...)", "file1.rpgsave");
    if (!!fname) {
        let fpath = `C:\\Program Files (x86)\\Steam\\steamapps\\common\\OMORI\\www\\save\\${fname}`;
        if (confirm("Import (OK) or Export (Cancel) save file?")) {
            let data = window.prompt("Save file data (copy & paste the content from the specified file)", "");
            if (!!data)
                require('fs').writeFileSync(fpath, data);
            else
                alert("Data not saved");
        } else {
            if (require('fs').existsSync(fpath)){
                let data = require('fs').readFileSync(fpath);
                window.prompt("Save file data", data);
            } else {
                alert("File not found");            
            }
        }
    }
}, true);
// OneLoader compatibility
var global = globalThis;

/**
 * @type {Chromori}
 */
globalThis.chromori = {
    fetch: function (method, path, callback, options = { type: undefined, data: undefined, json: false }) {
        const xhr = new XMLHttpRequest();
        if (options.type) xhr.responseType = options.type;

        xhr.open("POST", this.apiUrl + method, true);
        if (path) xhr.setRequestHeader("x-chromori-path", path); // TODO: why no encode
        xhr.addEventListener("load", () => {
            if (xhr.status != 200) {
                callback(xhr.status);
            } else if (options.json) {
                callback(xhr.status, JSON.parse(xhr.response));
            } else {
                callback(xhr.status, xhr.response);
            }
        });
        xhr.send(options.data);
    },

    fetchSync: function (method, path, options = { mime: undefined, data: undefined, json: false }) {
        const xhr = new XMLHttpRequest();
        if (options.mime) xhr.overrideMimeType(options.mime);

        xhr.open("POST", this.apiUrl + method, false);
        if (path) xhr.setRequestHeader("x-chromori-path", encodeURIComponent(path)); // TODO: why encode
        xhr.send(options.data);

        if (xhr.status != 200) {
            return { status: xhr.status };
        } else if (options.json) {
            return { status: xhr.status, res: JSON.parse(xhr.response) };
        } else {
            return { status: xhr.status, res: xhr.response };
        }
    },

    decoder: new TextDecoder(),
    encoder: new TextEncoder(),
    apiUrl: `/api`,

    createAchievementElement: function (name, description, icon, id) {
        const el = document.createElement("div");
        el.className = "chromori_achievement";
        el.id = id;
        el.innerHTML = `<div class="chromori_achievement_icon" style="background-image: url(${icon})"></div>
            <div class="chromori_achievement_text">
            <div class="chromori_achievement_name">${name}</div>
            <div class="chromori_achievement_desc">${description}</div>
            </div>`;
        return el;
    },
};

/**
 * @param {string} id
 */
globalThis.require = (id) => {
    let module = __requireCache[id];

    // hacky
    if (id.startsWith("./modloader")) {
        const fs = require("fs");
        const pp = require("path");
        // OneLoader
        const file = fs.readFileSync(pp.join(pp.dirname(process.mainModule.filename), id));

        function evalInScope(js, contextAsScope) {
            return function () {
                with (this) {
                    return eval(js);
                }
            }.call(contextAsScope);
        }

        const context = { module: { exports: {} } };
        evalInScope(chromori.decoder.decode(file), context);
        return context.module.exports;
    }

    if (!module) {
        console.error(`[nwcompat:require] module '${id}' not found`);
    }
    return module;
};
