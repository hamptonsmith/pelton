'use strict';

const SbError = require('@shieldsbetter/sberror2');

class NoSuchFile extends SbError {
    static messageTemplate = 'No such file: {{path}}';
}

class UnexpectedError extends SbError {
    static messageTemplate = 'Unexpected error: {{message}}';
}

module.exports = {
    NoSuchFile,
    noSuchFile(path) {
        return new NoSuchFile({ path });
    },

    UnexpectedError,
    unexpectedError(e) {
        return new UnexpectedError({ message: e.message }, e);
    }
};
