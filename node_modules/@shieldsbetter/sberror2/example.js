'use strict';

const assert = require('assert');
const SbError = require('./index');

class OutOfCheeseError extends SbError {
	static messageTemplate = 'Cheese port {{port}} is out of {{cheeseType}}.';
}

const cause = new Error('Cheese delivery late.');

try {
	throw new OutOfCheeseError(cause, {
		port: 5,
		cheeseType: 'gouda',
		deployment: 'turkey sandwich'
	});
}
catch (e) {
	assert.equal(e.message, 'Cheese port 5 is out of gouda.');
	assert.equal(e.cause, cause);

	assert(e instanceof Error);
	assert(e instanceof SbError);
	assert(e instanceof OutOfCheeseError);

	assert.equal(e.code, 'OUT_OF_CHEESE_ERROR');
	assert(e.outOfCheeseError);
	assert(e.sbError);

	assert.deepEqual(e.details, {
		port: 5,
		cheeseType: 'gouda',
		deployment: 'turkey sandwich'
	});

	assert.equal(e.port, 5);
	assert.equal(e.cheeseType, 'gouda');
	assert.equal(e.deployment, 'turkey sandwich');
}
