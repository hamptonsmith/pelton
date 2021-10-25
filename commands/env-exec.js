'use strict';

const errors = require('../standard-errors');
const PeltonProject = require('../utils/pelton-project');
const shellParse = require('shell-quote').parse;
const TemporaryFile = require('../utils/temporary-file');

exports.command = 'exec <serviceName> <command>';
exports.describe = 'Run command inside dependency container.'
exports.builder = yargs => yargs
        .positional('serviceName', {
            describe: 'Service name from the pelton docker-compose.yaml',
            type: 'string',
            required: true
        })
        .positional('command', {
            describe: 'Command, with arguments, to run.',
            type: 'string',
            required: true
        });

exports.handler = async (argv) => {
    const project = new PeltonProject(argv.projectDir);

    let curDockerCompose;
    try {
        curDockerCompose = await project.getDockerComposeConfig();
    }
    catch (e) {
        if (!(e instanceof errors.NoSuchFile)) {
            throw errors.unexpectedError(e);
        }

        console.log(`No docker-compose.yaml environment file at ${e.path}.`);
        process.exit(1);
    }

    const { PROJECT_NAME: projectName } = await project.getManifest();

    if (!projectName) {
        throw new Error('No PROJECT_NAME defined in pelton manifest.');
    }

    const maybeSudo = argv.dockerSudo ? ['sudo', '-E'] : [];
    const maybeNoTty = process.stdin.isTTY ? [] : ['-T'];

    const nextDockerFile = new TemporaryFile();
    await nextDockerFile.put(curDockerCompose);
    await project.exec([
        ...maybeSudo,
        'docker-compose',
        '--project-name', projectName,
        '--file', nextDockerFile.filename,
        'exec', ...maybeNoTty, argv.serviceName, ...shellParse(argv.command)
    ], { stdio: 'inherit' });
};
