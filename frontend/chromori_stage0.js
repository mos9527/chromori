/// <reference path="intellisense.d.ts"/>
// OneLoader compatibility
var global = globalThis;

/**
 * @type {Chromori}
 */
globalThis.chromori = {
    fetch: function (method, path, callback, options = { type: undefined, data: undefined, json: false, method: "POST" }) {
        const xhr = new XMLHttpRequest();
        if (options.type) xhr.responseType = options.type;

        xhr.open(options.method || "POST", this.apiUrl + method, true);
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

    fetchSync: function (method, path, options = { mime: undefined, data: undefined, json: false, method: "POST" }) {
        const xhr = new XMLHttpRequest();
        if (options.mime) xhr.overrideMimeType(options.mime);

        xhr.open(options.method || "POST", this.apiUrl + method, false);
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
    if (arguments[1].includes("$")) arguments[1] = `fallback?path=${require('fs').pathQuery(arguments[1])}`;
    XMLHttpRequest_prototype_open.apply(this, arguments);
    // always append the header afterwards    
    this.setRequestHeader("x-fs-path", url);
}

// Save file Import/Export
const env = JSON.parse(chromori.fetchSync("/env").res);
const fileDialogue = {    
    open: function (callback) {
        let el = document.createElement('input');         
        el.type = 'file';
        el.onchange = (evt) => {
            let file = evt.target.files[0];
            let reader = new FileReader();
            reader.onload = function (e) {
                callback(e.target.result);
            }
            try {
                reader.readAsText(file);
            } catch (e) {
                callback(null);
            }
        };
        let evt = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
        });
        el.dispatchEvent(evt);
    },
    save: function (data, filename) {
        let blob = new Blob([data], { type: 'text/plain' });
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}
const saveImportExport = (fname) => {
    let fpath = require('path').join(env._CWD,'www','save',fname);
    if (confirm("Import (OK) or Export (Cancel) save file?")) {           
        fileDialogue.open((data)=>{
            if (!!data)
                require('fs').writeFileSync(fpath, data);
            else
                alert("Data not imported");
        }) 
    } else {
        if (require('fs').existsSync(fpath)){
            let data = require('fs').readFileSync(fpath);
            fileDialogue.save(data, fname);
        } else {
            alert("File not found");            
        }
    }
}

document.addEventListener("dblclick", (evt) => {
    const saveFiles = ["global.rpgsave", "file1.rpgsave"];
    saveFiles.forEach((fname) => {
        if (window.confirm(`Save File: Import/Export ${fname}?`)) {           
            saveImportExport(fname);
            return;
        }
    });
}, true);