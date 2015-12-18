/// <reference path="http2.d.ts" />

"use strict";

import * as fs from 'fs';
// const fs: typeof NodeJS.fs = require('fs'); // <-- why does it not work (see server.ts)
//import { createServer } from 'http2';
// import { createServer } from 'https';

import { createServer as createServer2 } from "http2";
import { createServer as createServerS } from "https";

import { extname }  from 'path';


interface IResponse {
    writeHead: { (code: number, content: any): void; },
    end: { (content: Buffer, encoding: string): void; }
}

interface IRequest {
    url: string
}

interface IURL {
    location: string,
    port?: number,
    proto?: string
}

export class HttpsServer<T extends IURL> { // TODO:0 Rename to Http2Server issue:3
    private url: string;
    //private port: number; // hmmm. JS does not support private members and so does TS
    private port: () => number; // a little trick to force it
    // actually something that could be implemented through redmedical for instance.
    // this does not hide at all the member definiton, but it disallows to overwrite.
    private options: () => { key: Buffer, cert: Buffer };

    private proto: () => string;

    // TODO:0 Give the option to choose between http2 or http issue:2
    constructor(URL: T) {
        this.port = function() {
            return URL.port || 8080;
        }

        this.proto = function() {
            return URL.proto || "http2";
        }

        this.url = 'https://' + URL.location + ':' + this.port();

        var sec_key: Buffer = fs.readFileSync('secrets/server.key');
        var sec_cert: Buffer = fs.readFileSync('secrets/server.crt');

        this.options = function() {
            return {
                key: sec_key,
                cert: sec_cert
            };
        }
    }

    serve(): void {
        this.proto() === "http2" ? this.__serve_http2() : this.__serve_https()
        console.log( this.proto() + ' server running at ' + this.url);
    }

    private __serve_http2(): void {
        createServer2(this.options(), (req: IRequest, res: IResponse) => {
            var filePath: string = '.' + req.url;
            if (filePath == './')
                filePath = './index.html';
            var contentType: string = 'text/html';
            var ext: string = extname(filePath);

            switch (ext) {
                case '.js':
                    contentType = 'text/javascript';
                    break;

                case '.css':
                    contentType = 'text/css';
                    break;

                case '.json':
                    contentType = 'application/json';
                    break;
            }

            fs.readFile(filePath, (error: NodeJS.ErrnoException, content: Buffer) => {
                if (error) {
                    if (error.code === 'ENOENT') {
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(content, 'utf-8');
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        }).listen(this.port());
    }

    private __serve_https(): void {
        createServerS(this.options(), (req: IRequest, res: IResponse) => {
            var filePath: string = '.' + req.url;
            if (filePath == './')
                filePath = './index.html';
            var contentType: string = 'text/html';
            var ext: string = extname(filePath);

            switch (ext) {
                case '.js':
                    contentType = 'text/javascript';
                    break;

                case '.css':
                    contentType = 'text/css';
                    break;

                case '.json':
                    contentType = 'application/json';
                    break;
            }

            fs.readFile(filePath, (error: NodeJS.ErrnoException, content: Buffer) => {
                if (error) {
                    if (error.code === 'ENOENT') {
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(content, 'utf-8');
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        }).listen(this.port());

    }

    getURL(): string {
        return this.url;
    }
}
