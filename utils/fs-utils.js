'use strict';

const fs = require('fs');

async function getFileContents(filename) {
    return await fs.promises.readFile(filename, 'utf8');
}

async function putFileContents(filename, contents) {
    return await fs.promises.writeFile(filename, contents, 'utf8');
}

module.exports = {
    getFileContents,
    putFileContents
};
