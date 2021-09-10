'use strict';

const bs58 = require('bs58');
const crypto = require('crypto');
const envReady = require('./env-ready');
const errors = require('../standard-errors');
const getFreePort = require('get-port');
const PeltonProject = require('../utils/pelton-project');
const TemporaryFile = require('../utils/temporary-file');

exports.command = 'reset';
exports.describe = 'Clear existing isolation environments.'
exports.builder = yargs => yargs;

exports.handler = async (argv) => {
    const project = new PeltonProject(argv.projectDir);

    await envReady.handler(argv);

    const env = {};

    if (argv.dockerSudo) {
        env.PELTON_DOCKER_SUDO = '--docker-sudo';
    }

    await project.exec('./.pelton/clear-hermetic-environments', { env });
};

function toShortIsolationKey(longIsolationKey) {
    const hash = crypto.createHash('sha256').update(longIsolationKey).digest();
    return bs58.encode(hash).substring(0, 5);
}
