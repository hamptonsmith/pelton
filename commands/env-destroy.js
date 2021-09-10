'use strict';

const errors = require('../standard-errors');
const PeltonProject = require('../utils/pelton-project');
const TemporaryFile = require('../utils/temporary-file');

exports.command = 'destroy';
exports.describe = 'Destroy containers, networks, and volumnes associated '
        + 'with the development environment.'
exports.builder = yargs => yargs;

exports.handler = async (argv) => {
    const project = new PeltonProject(argv.projectDir);

    const peltonState = await project.getState();

    const { PROJECT_NAME: projectName } = await project.getManifest();

    if (!projectName) {
        throw new Error('No PROJECT_NAME defined in pelton manifest.');
    }

    const maybeSudo = argv.dockerSudo ? ['sudo', '-E'] : [];

    if (peltonState.lastDockerCompose !== undefined) {
        const lastDockerFile = new TemporaryFile();
        await lastDockerFile.put(peltonState.lastDockerCompose);
        await project.exec([
            ...maybeSudo,
            'docker-compose',
            '--project-name', projectName,
            '--file', lastDockerFile.filename,
            'down'
        ]);
    }

    peltonState.lastDockerCompose = undefined;
    await peltonState.commit();
};
