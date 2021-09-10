'use strict';

const envfile = require('envfile');
const errors = require('./standard-errors');
const fs = require('fs');
const pathLib = require('path');

async function getFileContents(filename) {
    return await fs.promises.readFile(filename, 'utf8');
}

async function putFileContents(filename, contents) {
    return await fs.promises.writeFile(filename, contents, 'utf8');
}


async function getPeltonEnv(projectDir) {
    return envfile.parse(
            await getPeltonFileContents(projectDir, 'env', ''));
}

async function getPeltonManifest(projectDir) {
    return envfile.parse(
            await getPeltonFileContents(projectDir, 'manifest'));
}

async function getPeltonFileContents(projectDir, filename, defaultContents) {
    const fullFilename = pathLib.join(projectDir, '.pelton', filename);

    let contents;
    try {
        contents = await getFileContents(fullFilename);
    }
    catch (e) {
        if (e.code !== 'ENOENT') {
            throw errors.unexpectedError(e);
        }

        if (defaultContents === undefined) {
            throw erros.noSuchFile(fullFilename);
        }

        contents = defaultContents;
    }

    return contents;
}

async function getPeltonState(projectDir) {
    const stateFile = pathLib.join(projectDir, '.peltonstate');

    let jsonState;
    try {
        jsonState = await getFileContents(stateFile);
    }
    catch (e) {
        if (e.code !== 'ENOENT') {
            throw errors.unexpectedError(e);
        }

        jsonState = '{}';
    }

    return {
        ...JSON.parse(jsonState),

        async commit() {
            await fs.promises.writeFile(
                stateFile,
                JSON.stringify(this, null, 4),
                'utf8');
        }
    };
}

module.exports = {
    getFileContents,
    getPeltonEnv,
    getPeltonFileContents,
    getPeltonManifest,
    getPeltonState,
    putFileContents
};
