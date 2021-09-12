'use strict';

const SbError = require('@shieldsbetter/sberror2');

class IncompatibleProject extends SbError {
    static messageTemplate = '{{reason}}';
}

class NoSuchFile extends SbError {
    static messageTemplate = 'No such file: {{path}}';
}

class SpawnedProcessError extends SbError {
    static messageTemplate = 'Error running `{{command}}`: {{message}}';
}

class UnexpectedError extends SbError {
    static messageTemplate = 'Unexpected error: {{message}}';
}

module.exports = {
    IncompatibleProject,
    incompatibleProject(reason) {
        return new IncompatibleProject({ reason });
    },

    NoSuchFile,
    noSuchFile(path) {
        return new NoSuchFile({ path });
    },

    SpawnedProcessError,
    spawnedProcessError(cause, command, message) {
        return new SpawnedProcessError({ command, message }, cause);
    },

    UnexpectedError,
    unexpectedError(e) {
        return new UnexpectedError({ message: e.message }, e);
    }
};
