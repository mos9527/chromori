/// <reference path="intellisense.d.ts"/>

const ERRNO_ENOENT = "ENOENT";

const createStat = (status, type) => {
    return {
        isFile: () => type === "file",
        isDirectory: () => type === "dir",
        exists: () => status === 200,
    };
};

const createErrorNoEnt = () => new Error(ERRNO_ENOENT);

const localStorageFs = (path) => {
    const whitelist = [".rpgsave", "TITLEDATA"];
    if (whitelist.some((ext) => path.endsWith(ext))) {
        // console.log(`LocalFs: ${path}`)
        return {
            stat: () => {                
                return {
                    isFile : () => true,
                    isDirectory : () => false,
                    exists : () => localStorage.getItem(path) !== null
                }
            },
            write: (data) => {
                if (typeof data == "number") data = data.toString();
                const buffer = Buffer.from(data);                
                localStorage.setItem(path, buffer.toString('base64'));
            },
            read: () => {
                let item = localStorage.getItem(path);
                const buffer = Buffer.from(item, 'base64');
                return buffer;   
            }
        }
    }
    return null;
}
// TODO: add console warning when async function called without callback

module.exports = {
    localStorageFs: localStorageFs,
    pathQuery: (path) => {
        return encodeURIComponent(path);
    },
    readFile(path, callback) {
        if (!callback) return;

        const localFs = localStorageFs(path);
        if (!!localFs) return callback(null, localFs.read());

        chromori.fetch(
            `/fs/readFile?path=${this.pathQuery(path)}`,
            path,
            (status, res) => {
                if (status != 200) {
                    if (path.includes("CUTSCENE.json")) callback(/* without error */);
                    else callback(createErrorNoEnt());
                } else {
                    callback(null, Buffer.from(res));
                }
            },
            { type: "arraybuffer", method: "GET" }
        );
    },

    readFileSync(path, options = "ascii") {

        const localFs = localStorageFs(path);

        let buffer = undefined;
        if (!!localFs) buffer = localFs.read();
        else {
            const { status, res } = chromori.fetchSync(
                `/fs/readFile?path=${this.pathQuery(path)}`,
                path, 
                {
                    mime: "text/plain; charset=x-user-defined",
                    method: "GET"
                }
            );
            if (status != 200) throw createErrorNoEnt();
            buffer = Buffer.from(res, "ascii");
        }

        let encoding = typeof options === "string" ? options : options.encoding;
        if (encoding === "utf8" || encoding === "utf-8") return chromori.decoder.decode(buffer);
        return buffer;
    },

    writeFile(path, data, callback) {
        if (!callback) return;
        
        const localFs = localStorageFs(path);
        if (!!localFs) { localFs.write(data); return callback(200); }

        if (typeof data === "string") {
            data = chromori.encoder.encode(data);
        }

        chromori.fetch("/fs/writeFile", path, callback, { data });
    },

    writeFileSync(path, data) {

        const localFs = localStorageFs(path);
        if (!!localFs) return localFs.write(data);
    
        if (typeof data === "string") {
            data = chromori.encoder.encode(data);
        }
        chromori.fetchSync("/fs/writeFile", path, { data });
    },

    readdir(path, callback) {
        chromori.fetch(
            "/fs/readDir",
            path,
            (status, res) => {
                callback(null, res.list);
            },
            { json: true }
        );
    },

    readdirSync(path) {
        let { res } = chromori.fetchSync("/fs/readDir", path, { json: true });
        return res.list;
    },

    // TODO: mkdir

    mkdirSync(path) {
        chromori.fetchSync("/fs/mkDir", path);
    },

    // TODO: unlink

    unlinkSync(path) {
        chromori.fetchSync("/fs/unlink", path);
    },

    stat(path, callback) {
        if (!callback) return;
        const localFs = localStorageFs(path);
        if (!!localFs) return callback(null, localFs.stat());

        chromori.fetch("/fs/stat", path, (status, res) => {
            callback(null, createStat(status, res));
        });
    },

    statSync(path) {
        const localFs = localStorageFs(path);
        if (!!localFs) return localFs.stat();
        
        const { status, res } = chromori.fetchSync("/fs/stat", path);
        return createStat(status, res);
    },

    existsSync(path) {
        return this.statSync(path).exists();
    },

    // TODO: lstat?

    rename(oldPath, newPath, callback) {
        if (!callback) return;
        chromori.fetch("/fs/rename", oldPath, callback, { data: newPath });
    },

    renameSync(oldPath, newPath) {
        chromori.fetchSync("/fs/rename", oldPath, { data: newPath });
    },

    // Stubs
    openSync() {},
    writeSync() {},
};
