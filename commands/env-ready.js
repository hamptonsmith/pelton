'use strict';

const errors = require('../standard-errors');
const PeltonProject = require('../utils/pelton-project');
const TemporaryFile = require('../utils/temporary-file');

exports.command = 'ready';
exports.describe = 'Update development environment as necessary and bring it '
        + 'into a running and healthy state.'
exports.builder = yargs => yargs;

exports.handler = async (argv) => {
    const project = new PeltonProject(argv.projectDir);

    const peltonState = await project.getState();
    const { lastDockerCompose } = peltonState;

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

    const maybeSudo = argv.dockerSudo ? 'sudo -E' : '';

    if (lastDockerCompose !== undefined
            && lastDockerCompose !== curDockerCompose) {
        const lastDockerFile = new TemporaryFile();
        lastDockerFile.put(lastDockerCompose);

        await project.exec(`
            ${maybeSudo} docker-compose \
                    --project-name ${projectName} \
                    --file ${lastDockerFile.filename} \
                    down
        `);
    }

    const nextDockerCompose = new TemporaryFile();
    await nextDockerCompose.put(curDockerCompose);
    await project.exec(`
        ${maybeSudo} docker-compose \
                --project-name ${projectName} \
                --file ${nextDockerCompose.filename} \
                up --detach
    `);

    peltonState.lastDockerCompose = curDockerCompose;
    await peltonState.commit();

    if (await project.configFileExists('runtime-platform-Dockerfile')) {
        const runtimeDockerfilePath =
                project.getConfigPath('runtime-platform-Dockerfile');

        await project.exec(`
            ${maybeSudo} docker build \
                    --file ${runtimeDockerfilePath} \
                    --tag pelton-${projectName}-runtime \
                    .
        `);
    }
};
