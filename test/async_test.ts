function readFile(filename: string) {
    return new Promise((resolve, reject) => {
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
    for (let file of getfiles()) {
        try {
            var data = await readFile(file);
            logwords(file, data);
        } catch (err) {
            console.log(`Failed to read file "${file}" with error: ${err}`);
        }
    }
}

run();