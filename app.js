#!/usr/bin/env node

'use strict';

const errors = require('./standard-errors');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

Promise.resolve(yargs(hideBin(process.argv))
    .command(require('./commands/env'))
    .command(require('./commands/reset'))
    .command(require('./commands/start'))
    .command(require('./commands/stop'))
    .option('docker-sudo', {
        alias: 'S',
        description: 'Use `sudo` when executing docker commands.',
        global: true,
        type: 'boolean'
    })
    .option('project-dir', {
        alias: 'D',
        default: '.',
        description: 'Root of the pelton-enabled project.',
        global: true,
        type: 'string'
    })
    .help()
    .fail((msg, e) => {
        if (e instanceof errors.IncompatibleProject) {
            console.log();
            console.log('This project is not configured to support this '
                    + 'operation:');
            console.log();
            console.log(e.message);
            console.log();
        }
        else {
            if (msg) {
                console.log(msg);
            }

            if (e) {
                console.log(e);

                e = e.cause;
                while (e) {
                    console.log('\nCaused by:', e);
                    e = e.cause;
                }
            }
        }

        process.exit(1);
    })
    .argv);
