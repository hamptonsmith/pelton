'use strict';

const childProcessLib = require('child_process');
const envfile = require('envfile');
const errors = require('../standard-errors');
const fs = require('fs');
const fsUtils = require('./fs-utils');
const pathLib = require('path');
const shellParse = require('shell-quote').parse;
const TemporaryFile = require('./temporary-file');

module.exports = class PeltonProject {
    constructor(projectDir) {
        this.projectDir = projectDir;
    }

    async configFileExists(...filenameParts) {
        const configPath = this.getConfigPath(...filenameParts);

        let result;

        try {
            await fs.promises.access(configPath, fs.constants.F_OK);
            result = true;
        }
        catch (e) {
            if (e.code !== 'ENOENT') {
                throw errors.unexpectedError(e);
            }

            result = false;
        }

        return result;
    }

    async exec(
        cmdArray,
        { env = {}, stdio = ['inherit', 'inherit', 'pipe']} = {}
    ) {
        if (typeof cmdArray === 'string') {
            cmdArray = shellParse(cmdArray);
        }

        const peltonEnv = await this.getEnv();

        const [command, ...commandArgs] = cmdArray;

        const childProcess = childProcessLib.spawn(command, commandArgs, {
            cwd: this.projectDir,
            env: { ...process.env, ...peltonEnv, ...env },
            stdio
        })

        function sigintForwarder() {
            process.on('SIGINT', () => {
                childProcess.kill('SIGINT');
                process.removeListener('SIGINT', sigintForwarder);
            });
        }

        process.on('SIGINT', sigintForwarder);

        let stderr = '';

        if (childProcess.stderr) {
            childProcess.stderr.on('data', data => {
                stderr += data;
            });
        }

        try {
            await new Promise((resolve, reject) => {
                // https://nodejs.org/api/child_process.html#child_process_event_error
                // "When listening to both the 'exit' and 'error' events, guard
                //  against accidentally invoking handler functions multiple times."
                let returned;

                childProcess.on('exit', (code, signal) => {
                    if (returned) {
                        return;
                    }
                    returned = true;

                    process.removeListener('SIGINT', sigintForwarder);

                    if (code !== null && code !== 0) {
                        reject(new Error(stderr));
                    }
                    else {
                        resolve();
                    }
                });

                childProcess.on('error', err => {
                    if (returned) {
                        return;
                    }
                    returned = true;

                    process.removeListener('SIGINT', sigintForwarder);

                    reject(err);
                });
            });
        }
        catch (e) {
            throw errors.spawnedProcessError(e, cmdArray.join(' '), e.message);
        }
    }

    getConfigPath(...filenameParts) {
        return pathLib.join(this.projectDir, '.pelton', ...filenameParts);
    }

    async getEnv() {
        return envfile.parse(await this.getPeltonFileContents('env', ''));
    }

    async getManifest() {
        return envfile.parse(await this.getPeltonFileContents('manifest'));
    }

    async getDockerComposeConfig() {
        return await this.getPeltonFileContents('docker-compose.yaml');
    }

    async getPeltonFileContents(filename, defaultContents) {
        const fullFilename = this.getConfigPath(filename);

        let contents;
        try {
            contents = await fsUtils.getFileContents(fullFilename);
        }
        catch (e) {
            if (e.code !== 'ENOENT') {
                throw errors.unexpectedError(e);
            }

            if (defaultContents === undefined) {
                throw errors.noSuchFile(fullFilename);
            }

            contents = defaultContents;
        }

        return contents;
    }

    async getState() {
        const stateFile = pathLib.join(this.projectDir, '.peltonstate');

        let jsonState;
        try {
            jsonState = await fsUtils.getFileContents(stateFile);
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
                await fsUtils.putFileContents(
                    stateFile,
                    JSON.stringify(this, null, 4));
            }
        };
    }
}
