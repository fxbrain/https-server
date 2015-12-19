/// <reference path="http2.d.ts" />

"use strict";

import * as fs from "fs";
// const fs: typeof NodeJS.fs = require("fs"); // <-- why does it not work (see server.ts)

import { createServer as createServer2 } from "http2";
import { createServer as createServerS } from "https";

import { extname }  from "path";


interface IResponse {
    writeHead: { (code: number, content: any): void; };
    end: { (content: Buffer, encoding: string): void; };
}

interface IRequest {
    url: string;
}

interface IChallenge {
    location: string;
    port?: number;
    proto?: string;
    dynamic?: boolean;
}

interface Document {
    createElement(tagName: "div"): HTMLDivElement;
    createElement(tagName: "span"): HTMLSpanElement;
    createElement(tagName: "canvas"): HTMLCanvasElement;
    createElement(tagName: string): HTMLElement;
}

namespace types {
    export const enum CharacterCodes {
        colon = 0x3A,
        slash = 0x2F
    }
}
namespace core {

    let directorySeparator = "/";

    /**
     * Returns the last element of an array if non-empty, undefined otherwise.
     */
    function lastOrUndefined<T>(array: T[]): T {
        if (array.length === 0) {
            return undefined;
        }
        return array[array.length - 1];
    }

    function normalizeSlashes(path: string): string {
        return path.replace(/\\/g, "/");
    }

    // Returns length of path root (i.e. length of "/", "x:/", "//server/share/, file:///user/files")
    function getRootLength(path: string): number {
        if (path.charCodeAt(0) === types.CharacterCodes.slash) {
            if (path.charCodeAt(1) !== types.CharacterCodes.slash) return 1;
            const p1 = path.indexOf("/", 2);
            if (p1 < 0) return 2;
            const p2 = path.indexOf("/", p1 + 1);
            if (p2 < 0) return p1 + 1;
            return p2 + 1;
        }
        if (path.charCodeAt(1) === types.CharacterCodes.colon) {
            if (path.charCodeAt(2) === types.CharacterCodes.slash) return 3;
            return 2;
        }
        // Per RFC 1738 'file' URI schema has the shape file://<host>/<path>
        // if <host> is omitted then it is assumed that host value is 'localhost',
        // however slash after the omitted <host> is not removed.
        // file:///folder1/file1 - this is a correct URI
        // file://folder2/file2 - this is an incorrect URI
        if (path.lastIndexOf("file:///", 0) === 0) {
            return "file:///".length;
        }
        const idx = path.indexOf("://");
        if (idx !== -1) {
            return idx + "://".length;
        }
        return 0;
    }

    export function getDirectoryPath(path: string) {
        return path.substr(0, Math.max(getRootLength(path), path.lastIndexOf(directorySeparator)));
    }

    export function getExecutingFilePath(): string {
        return __filename;
    }
}

export class HttpsServer<T extends IChallenge> {
    private url: string;
    // private port: number; // hmmm. JS does not support private members and so does TS
    private port: () => number; // a little trick to force it
    // actually something that could be implemented through redmedical for instance.
    // this does not hide at all the member definiton, but it disallows to overwrite.
    private options: () => { key: Buffer, cert: Buffer };

    private proto: () => string;

    private behavior: boolean;

    constructor(URL: T) {
        this.port = function() {
            return URL.port || 8080;
        };

        this.proto = function() {
            return URL.proto || "http2";
        };
        this.url = "https://" + URL.location + ":" + this.port();

        this.behavior = URL.dynamic;

        const dirPath = core.getDirectoryPath(core.getExecutingFilePath());

        let sec_key: Buffer = fs.readFileSync(dirPath + "/secrets/server.key");
        let sec_cert: Buffer = fs.readFileSync(dirPath + "/secrets/server.crt");

        this.options = function() {
            return {
                key: sec_key,
                cert: sec_cert
            };
        };
    }

    serve(): void {
        this.proto() === "http2" ? this.__serve_http2(this.behavior) : this.__serve_https(this.behavior);
        console.log(this.proto() + " server running at " + this.url);
    }

    private __serve_http2(dynamic?: boolean): void {
        if (!dynamic) {
            createServerS(this.options(), (req: IRequest, res: IResponse) => {
                let filePath: string = "." + req.url;
                if (filePath === "./") {
                    filePath = "./index.html";
                }
                let contentType = "text/html";
                let ext: string = extname(filePath);

                switch (ext) {
                    case ".js":
                        contentType = "text/javascript";
                        break;

                    case ".css":
                        contentType = "text/css";
                        break;

                    case ".json":
                        contentType = "application/json";
                        break;
                }

                fs.readFile(filePath, (error: NodeJS.ErrnoException, content: Buffer) => {
                    if (error) {
                        if (error.code === "ENOENT") {
                            res.writeHead(200, { "Content-Type": contentType });
                            res.end(content, "utf-8");
                        }
                    } else {
                        res.writeHead(200, { "Content-Type": contentType });
                        res.end(content, "utf-8");
                    }
                });
            }).listen(this.port());
        } else {
            createServer2(this.options(), this.onRequest).listen(this.port());
        }
    }

    private __serve_https(dynamic?: boolean): void {
        if (!dynamic) {
            createServerS(this.options(), (req: IRequest, res: IResponse) => {
                let filePath: string = "." + req.url;
                if (filePath === "./") {
                    filePath = "./index.html";
                }
                let contentType = "text/html";
                let ext: string = extname(filePath);

                switch (ext) {
                    case ".js":
                        contentType = "text/javascript";
                        break;

                    case ".css":
                        contentType = "text/css";
                        break;

                    case ".json":
                        contentType = "application/json";
                        break;
                }

                fs.readFile(filePath, (error: NodeJS.ErrnoException, content: Buffer) => {
                    if (error) {
                        if (error.code === "ENOENT") {
                            res.writeHead(200, { "Content-Type": contentType });
                            res.end(content, "utf-8");
                        }
                    } else {
                        res.writeHead(200, { "Content-Type": contentType });
                        res.end(content, "utf-8");
                    }
                });
            }).listen(this.port());
        } else {
            createServerS(this.options(), this.onRequest).listen(this.port());
        }
    }

    onRequest(req: IRequest, res: IResponse): void {
        res.writeHead(200, { "Content-Type": "text/text" });
        res.end(new Buffer("Requests work! :" + req.url), "utf-8");
    }

    getURL(): string {
        return this.url;
    }
}
