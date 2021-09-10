'use strict';

exports.command = 'env <command>';
exports.aliases = ['environment'];

exports.describe = 'Development environment management.';
exports.builder = yargs => yargs
        .command(require('./env-destroy'))
        .command(require('./env-exec'))
        .command(require('./env-ready'));
