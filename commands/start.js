'use strict';

const bs58 = require('bs58');
const crypto = require('crypto');
const envReady = require('./env-ready');
const errors = require('../standard-errors');
const expandenv = require('expandenv');
const getFreePort = require('get-port');
const pathLib = require('path');
const PeltonProject = require('../utils/pelton-project');
const TemporaryFile = require('../utils/temporary-file');

exports.command = 'start';
exports.describe = 'Bring service into a running state.'
exports.builder = {
    detach: {
        alias: 'd',
        type: 'boolean',
        default: false,
        describe: 'Run in detached mode.'
    },
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
    const {
        DEFAULT_PORT,
        PROJECT_NAME: projectName,
        RUNTIME_PLATFORM: explicitRuntimePlatform
    } = await project.getManifest();

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

    const ttyOpts =
            (process.stdin.isTTY ? 'i' : '')
            + (process.stdout.isTTY ? 't' : '');

    const maybeSudo = argv.dockerSudo ? ['sudo', '-E'] : [];
    const maybeTty = ttyOpts !== '' ? [`-${ttyOpts}`] : [];
    const maybeDetach = argv.detach ? ['-d'] : [];

    const runtimePlatform = explicitRuntimePlatform ||
            (await project.configFileExists('runtime-platform-Dockerfile'))
            ? `pelton-${projectName}-runtime`
            : 'ubuntu:latest';

    const projectRootAbs = pathLib.resolve(argv.projectDir);

    const authSockDir = pathLib.dirname(process.env.SSH_AUTH_SOCK);

    // Using this rather than docker's built-in --env-file so we can take the
    // opportunity to expand environment variables.
    const envOpts = [];
    const envFile = await project.getEnv();
    for (const [key, value] of Object.entries(envFile)) {
        envOpts.push('-e');
        envOpts.push(`${key}=${expandenv(value)}`);
    }

    try {
        await project.exec([
            ...maybeSudo, 'docker', 'run', ...maybeTty, '--rm', '--init',
                    ...maybeDetach,
                    ...envOpts,
                    '-e', `PORT=${port}`,
                    '--volume', `${authSockDir}:${authSockDir}`,
                    '-e', `SSH_AUTH_SOCK=${process.env.SSH_AUTH_SOCK}`,
                    '--volume', '/var/run/docker.sock:/var/run/docker.sock',
                    '--volume', `${projectRootAbs}:/projectRoot`,
                    '--volume', '/tmp:/tmp',
                    '-e', `ISOLATION_KEY=${env.ISOLATION_KEY}`,
                    '--name', `pelton_${projectName.replace(/_/g, '-_')}_${env.ISOLATION_KEY}`,
                    '--workdir', '/projectRoot',
                    '--entrypoint', '/projectRoot/.pelton/hermetic-start',
                    runtimePlatform
        ], {
            env,
            stdio: 'inherit'
        });
    }
    catch (e) {
        throw errors.unexpectedError(e);
    }
};

function toShortIsolationKey(longIsolationKey) {
    const hash = crypto.createHash('sha256').update(longIsolationKey).digest();
    return bs58.encode(hash).substring(0, 5);
}
