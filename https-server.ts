/// <reference path="http2.d.ts" />

"use strict";

import * as fs from "fs";
import { extname }  from "path";

declare var require;
import https = require("https");
import http2 = require("http2");

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

export class HttpsServer<T extends IChallenge> {
    private url: string;
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

        this.behavior = URL.dynamic || true;

        let sec_key: Buffer = fs.readFileSync(__dirname + "/secrets/server.key");
        let sec_cert: Buffer = fs.readFileSync(__dirname + "/secrets/server.crt");

        this.options = function() {
            return {
                key: sec_key,
                cert: sec_cert
            };
        };
    }

    serve(): void {
        this.__serve(this.behavior);
        console.log(this.proto() + " server running at " + this.url);
    }

    private __serve(dynamic: boolean): void {
        let ref: typeof https | typeof http2;
        if (this.proto() === "http2") {
            ref = require("http2");
        } else {
            ref = require("https");
        }

        if (!dynamic) {
            ref.createServer(this.options(), (req: IRequest, res: IResponse) => {
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
            ref.createServer(this.options(), this.__onRequest).listen(this.port());
        }
    }

    private __onRequest(req: IRequest, res: IResponse): void {
        res.writeHead(200, { "Content-Type": "text/text" });
        res.end(new Buffer("Requests work! :" + req.url), "utf-8");
    }

    get URL(): string {
        return this.url;
    }
}
