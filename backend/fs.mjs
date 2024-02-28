import { join } from "path";

import { config as uConfig, fs } from "./utils.mjs";
import { resolveOverlay } from "./overlay/index.mjs";

const config = await uConfig.load();
const wwwPath = join(config.gamePath, config.gameDirectory);

/**
 * @param {import('express').Express} app
 */
export default (app) => {
    app.all("/api/fs/readFile", async (req, res) => {
        // see backend/static.js:21
        // although i'm not sure if it's necessary here
        try {
            res.chromoriPath = decodeURIComponent(res.chromoriPath);
        } catch (e) {
            console.error(`fs.readFile: decodeURIComponent('${res.chromoriPath}') error`);
            console.error(e);
        }

        try {
            // don't try to resolve overlay if reading not game files
            if (res.chromoriPath.includes(wwwPath)) {
                const relativePath = res.chromoriPath.replace(wwwPath, "");
                const fileOverlay = await resolveOverlay(relativePath);

                if (fileOverlay) {
                    return res.send(fileOverlay);
                }
            }

            if (await fs.isFile(res.chromoriPath)) {
                res.contentType("text/plain");
                return res.sendFile(res.chromoriPath);
            } else {
                console.log(`fs.readFile: '${res.chromoriPath}' is not a file`);
            }
            return res.status(404).end();
        } catch (e) {
            console.error(e);
        }

        res.status(404).end();
    });

    app.all("/api/fs/writeFile", async (req, res) => {
        try {
            await fs.writeFile(res.chromoriPath, req.body);
            res.status(200).end();
        } catch (e) {
            console.error(e);
            res.status(500).end();
        }
    });

    app.all("/api/fs/readDir", async (req, res) => {
        try {
            res.send({ list: await fs.readdir(res.chromoriPath) });
        } catch (e) {
            console.log(`fs.readDir: ${res.chromoriPath} is not a directory`);
            res.status(404).end();
        }
    });

    app.all("/api/fs/mkDir", async (req, res) => {
        try {
            await fs.mkdir(res.chromoriPath);
            res.status(200).end();
        } catch (e) {
            console.error(e);
            res.status(500).end();
        }
    });

    app.all("/api/fs/unlink", async (req, res) => {
        try {
            await fs.unlink(res.chromoriPath);
            res.status(200).end();
        } catch (e) {
            console.error(e);
            res.status(500).end();
        }
    });

    app.all("/api/fs/stat", async (req, res) => {
        try {
            const stat = await fs.stat(res.chromoriPath);
            res.send(stat.isFile() ? "file" : "dir");
        } catch (e) {
            console.log(`fs.stat: '${res.chromoriPath}' not found`);
            res.status(404).end();
        }
    });

    app.all("/api/fs/rename", async (req, res) => {
        try {
            await fs.rename(res.chromoriPath, req.body);
        } catch (e) {
            console.error(e);
        }

        res.status(200).end();
    });
};
