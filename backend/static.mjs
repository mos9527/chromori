import { join, extname } from "path";

import { config as uConfig, fs } from "./utils.mjs";
import { resolveOverlay } from "./overlay/index.mjs";
import express from "express";

const config = await uConfig.load();
const wwwPath = join(config.gamePath, config.gameDirectory);
const frontendPath = join(process.cwd(), "frontend");

/**
 * @param {import('express').Express} app
 */
export default (app) => {
    app.use("/chromori", express.static(frontendPath));
    app.use("/.oneloader-image-cache", express.static(".oneloader-image-cache"));
    app.use("/", async (req, res) => {
        let url = req.url;
        if (url == "/") url += "index.html";

        if (req.headers['x-fs-path'])
            url = req.headers['x-fs-path']

        try {
            url = decodeURIComponent(url)
        } catch(e) {
            // pass
        }

        try {
            const fileOverlay = await resolveOverlay(url);

            if (fileOverlay) {     
                return res.send(fileOverlay);
            } else {
                const path = await fs.matchPath(join(wwwPath, url));

                if (await fs.isFile(path)) {
                    if (extname(path) == ".wasm") res.contentType("application/wasm");
                    return res.sendFile(path);
                } else {
                    console.log(`did not locate ${path} -> ${join(wwwPath, url)}`);
                }
            }
        } catch (e) {
            console.error("static error");
            console.error(e);
        }

        res.status(404).end();
    });
};
