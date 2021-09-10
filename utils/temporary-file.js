'use strict';

const fs = require('fs');
const fsUtils = require('./fs-utils');
const tmp = require('tmp');

module.exports = class TemporaryFile {
    constructor() {
        const { name } = tmp.fileSync();
        this.filename = name;
    }

    async put(contents) {
        return await fsUtils.putFileContents(this.filename, contents);
    }

    async get() {
        return await fsUtils.getFileContents(this.filename);
    }
};
