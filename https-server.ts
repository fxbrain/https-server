/// <reference path="typings/node/node.d.ts" />

/// <reference path="typings/asmcrypto/asmcrypto.d.ts" />

//import { readFileSync, readFile } from 'fs';

"use strict";

import * as fs from 'fs';
import { createServer } from 'https';
import { extname }  from 'path';


interface Response {
    writeHead: { (code:number, content:any):void; },
    end: { (content:Buffer, encoding:string):void; }
}

interface Request {
    url: string
}

interface URL {
    location: string,
    port?: number
}

export class HttpsServer<T extends URL> {
    private url: string;
    //private port: number; // hmmm. JS does not support private members and so does TS
    private port: () => number; // a little trick to force it
    // actually something that could be implemented through redmedical for instance.
    // this does not hide at all the member definiton, but it disallows to overwrite.
    private options: () => { key: Buffer, cert: Buffer };
    
    constructor(URL: T) {
        this.port = function() {
            return URL.port || 8080; 
        }

        this.url = 'https://' + URL.location + ':' + this.port();

        var sec_key: Buffer = fs.readFileSync('secrets/server.key');
        var sec_cert: Buffer = fs.readFileSync('secrets/server.crt');
        
        this.options = function() {
            return { key: sec_key,
                     cert: sec_cert
                   };
        }
    }

    serve(): void {
        createServer(this.options(), (req: Request, res: Response) => {
            var filePath: string = '.' + req.url;
            if(filePath == './')
                filePath = './index.html';
            var contentType: string = 'text/html';
            var ext: string = extname(filePath);

            switch(ext) {
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
                if(error) {
                    if(error.code === 'ENOENT') { 
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(content, 'utf-8');
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        }).listen(this.port());

        console.log('Server running at :' + this.url);
    }

    getURL(): string {
        return this.url;
    }

    sendUpdates(emailAddr: (string | string[])) {
        //is emailAddr an Array?
        
        if(Array.isArray(emailAddr)) {
            emailAddr.forEach((val, idx) => {
                val.trim();
            });
        } else {
            emailAddr.trim();
        }
    }
}

function readFile(filename: string) {
    return new Promise( (resolve, reject) => {
        fs.readFile(filename, 'utf-8', (err, data) => {
            err ? reject(err) : resolve(data);
        });
    });
}

function* getfiles() {
    yield '../https-server.ts';
    // ...
}

function logwords(filename, text) {
    console.log(`File "${filename}" has ${text.split(' ').length} words`);
}

async function run() {
    for(let file of getfiles()) {
        try {
            var data = await readFile(file);
            logwords(file, data);
        }
        catch(err) {
            console.log(`Failed to read file "${file}" with error: ${err}`);
        }
    }
}

run();
