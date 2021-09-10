'use strict';

const bs58 = require('bs58');
const crypto = require('crypto');
const envReady = require('./env-ready');
const errors = require('../standard-errors');
const getFreePort = require('get-port');
const PeltonProject = require('../utils/pelton-project');
const TemporaryFile = require('../utils/temporary-file');

exports.command = 'start';
exports.describe = 'Bring service into a running state.'
exports.builder = {
    isolationKey: {
        alias: 'k',
        describe: 'Key used to isolate the environment.',
        type: 'string',
        default: 'default'
    },
    port: {
        alias: 'p',
        default: 'manifest.DEFAULT_PORT',
        describe: 'Port on which to run the service. 0 for arbitrary.'
    },
    reason: {
        alias: 'r',
        default: 'some reason',
        describe: 'Descriptive reason for starting the service.'
    }
};

exports.handler = async (argv) => {
    const project = new PeltonProject(argv.projectDir);

    await envReady.handler(argv);
    const { DEFAULT_PORT } = await project.getManifest();

    let port = argv.port === 'manifest.DEFAULT_PORT' ?
            (DEFAULT_PORT || 0) : argv.port;

    if (port === 0) {
        // Yes, this is bad and there's a race condition here: we could find a
        // free port and then it becomes not-free between now and when the
        // project service comes up and manages to bind it. But the failure mode
        // there is acceptable: the service will presumably crash and then
        // whoever tried to run us (person or machine) will detect that failure
        // and try again. Whereas making the service pick its own port forces
        // us to export complexity to the project to somehow get that port back
        // out to us.
        port = await getFreePort();
    }

    const env = {
        PORT: port,
        ISOLATION_KEY: toShortIsolationKey(argv.isolationKey)
    };

    if (argv.dockerSudo) {
        env.PELTON_DOCKER_SUDO = '--docker-sudo';
    }

    await project.exec(`./.pelton/hermetic-start "${argv.reason}"`, {
        env,
        stdio: 'inherit'
    });
};

function toShortIsolationKey(longIsolationKey) {
    const hash = crypto.createHash('sha256').update(longIsolationKey).digest();
    return bs58.encode(hash).substring(0, 5);
}
