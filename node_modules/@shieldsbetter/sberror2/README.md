# Shieldsbetter Errors

Javascript errors to my particular sensibilities.

## TL;DR

```javascript
const assert = require('assert');
const SbError = require('@shieldsbetter/sberrors2');

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
```

## Details

Static field `messageTemplate` will be rendered by the static method
`renderMessage`, which simply wraps
[Mustache](https://www.npmjs.com/package/mustache)`.render()` by default.

`renderMessage()` will be called with two arguments:

* The message template
* A details object (which could potentially be `undefined` but if defined is
  guaranteed to be an object)

Attempting to instantiate an error without a top-level `messageTemplate` will
yield an `SbError.CannotInstantiateAbstract` error.

Non-abstract error types may be instantiated with one or both of an
[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
cause and a details object, in any order.
