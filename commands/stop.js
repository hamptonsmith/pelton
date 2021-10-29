'use strict';

const bs58 = require('bs58');
const crypto = require('crypto');
const errors = require('../standard-errors');
const getFreePort = require('get-port');
const pathLib = require('path');
const PeltonProject = require('../utils/pelton-project');
const TemporaryFile = require('../utils/temporary-file');

exports.command = 'stop';
exports.describe = 'Stop a running service.'
exports.builder = {
    isolationKey: {
        alias: 'k',
        describe: 'Key used to isolate the environment.',
        type: 'string',
        default: 'default'
    }
};

exports.handler = async (argv) => {
    const project = new PeltonProject(argv.projectDir);

    const { PROJECT_NAME: projectName } = await project.getManifest();

    const env = {
        ISOLATION_KEY: toShortIsolationKey(argv.isolationKey)
    };

    if (argv.dockerSudo) {
        env.PELTON_DOCKER_SUDO = '--docker-sudo';
    }

    const maybeSudo = argv.dockerSudo ? ['sudo', '-E'] : [];

    try {
        await project.exec([
            ...maybeSudo, 'docker', 'stop',
                    `pelton_${projectName.replace(/_/g, '-_')}_${env.ISOLATION_KEY}`
        ], {
            env
        });
    }
    catch (e) {
        if (!e.message.includes('No such container')) {
            throw errors.unexpectedError(e);
        }
    }
};

function toShortIsolationKey(longIsolationKey) {
    const hash = crypto.createHash('sha256').update(longIsolationKey).digest();
    return bs58.encode(hash).substring(0, 5);
}
