'use strict';

const Mustache = require('mustache');

const { camelCase } = require('camel-case');
const { constantCase } = require('constant-case');

const topSecret = new Object();

class SbError extends Error {
    constructor(...args) {
        super();

        const name = this.__proto__.constructor.name || 'AnonymousSbError';

        if (!this.__proto__.constructor.hasOwnProperty('messageTemplate')) {
            throw buildAbstractError({ typeName: name });
        }

        const msgTemplate = this.__proto__.constructor.messageTemplate;

        let cause;
        let details;

        while (args.length > 0) {
            const arg = args.shift();
            if (arg instanceof Error) {
                cause = arg;
            }
            else if (typeof arg === 'object') {
                details = arg;
            }
            else {
                throw buildUnexpectedTypeError({
                    actual: typeof arg,
                    expected: 'Error or object'
                });
            }
        }

        if (cause) {
            this.cause = cause;
        }

        if (details) {
            this.details = details;

            for (let [key, value] of Object.entries(details)) {
                if (!this[key]) {
                    this[key] = value;
                }
            }
        }

        this.details = details;
        this.message =
                this.__proto__.constructor.renderMessage(msgTemplate, details);

        if (!this.code) {
            this.code = constantCase(name);
        }

        let level = this.__proto__;
        while (level) {
            if (level.constructor.name) {
                const levelName = camelCase(level.constructor.name);
                if (!this[levelName]) {
                    this[levelName] = true;
                }
            }

            level = level.__proto__;
        }
    }

    static renderMessage(template, details) {
        return Mustache.render(template, details);
    }
}

class CannotInstantiateAbstract extends SbError {
    static messageTemplate = '{{typeName}} is an abstract error type and '
            + 'cannot be instantiated.  Create a concrete subtype and '
            + 'instantiate that.  Did you miss the `static` modifier on your'
            + 'message template definition?';
};

class UnexpectedType extends SbError {
    static messageTemplate =
            'Unexpected type: {{actual}}.  Expected {{expected}}.';
}

// Just allow forward references to these errors.
function buildAbstractError(details) {
    return new CannotInstantiateAbstract(details);
}

function buildUnexpectedTypeError(details) {
    return new UnexpectedType(details);
}

module.exports = SbError;

module.exports.CannotInstantiateAbstract = CannotInstantiateAbstract;
module.exports.UnexpectedType = UnexpectedType;
