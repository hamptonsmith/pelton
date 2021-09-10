const assert = require('assert');
const SbError = require('./index');

{
    const AError = class extends SbError { static messageTemplate = 'A msg'; };
    const BError = class extends AError { static messageTemplate = 'B msg'; };
    const b = new BError();

    assert.equal(b.code, 'B_ERROR', 'should have subtype name constant case');
    assert(b.bError, 'should have subtype name camel case property set');
    assert(b.aError, 'should have parent type name camel case property set');

    assert(b instanceof BError,
            'SbError subtypes should be instanceof themselves');
    assert(b instanceof AError,
            'SbError subtypes should be instanceof any parent type');
    assert(b instanceof SbError,
            'SbError subtypes should be instanceof SbError');
    assert(b instanceof Error, 'SbError subtypes should be instanceof Error');
}

{
    const cause = new Error();

    const A = class extends SbError { static messageTemplate = 'A msg'; };
    const B = class extends A { static messageTemplate = 'B msg'; };
    const details = {};
    const b = new B(details, cause);

    assert.equal(b.cause, cause, 'cause should be set as a property');
    assert.equal(b.details, details,
            'error should have reference to empty details');
}

{
    const cause = new Error();

    const A = class extends SbError { static messageTemplate = 'A msg'; };
    const B = class extends A { static messageTemplate = 'B msg'; };
    const b = new B(cause);

    assert.equal(b.cause, cause, 'cause can be provided with no details');
    assert(typeof b.details === 'undefined',
            'error built with omitted details should not have a details field');
}

{
    const A = class extends SbError {
        static messageTemplate = 'A msg: {{aValue}}';
    };
    const B = class extends A { static messageTemplate = 'B msg: {{bValue}}'; };
    const details = {
        aValue: 'value a',
        bValue: 'value b'
    };
    const b = new B(details);

    assert.equal(b.message, 'B msg: value b',
            'Highest level template should be filled, but was: ' + b.message);
    assert.deepEqual([b.aValue, b.bValue], ['value a', 'value b'],
            'Details should be copied into top level error');
    assert.equal(b.details, details, 'details property should be reference ' +
            'to original details');
}

{
    try {
        const Sub =
                class extends SbError { static messageTemplate = 'SubMsg'; };
        new Sub('these aren\'t details at all!');
    }
    catch (e) {
        assert(e instanceof SbError.UnexpectedType, 'providing non-object ' +
                'details throws an UnexpectedType error');
    }
}

{
    try {
        new SbError();
    }
    catch (e) {
        assert(e instanceof SbError.CannotInstantiateAbstract, 'attempting ' +
                'to instantiate root error should throw ' +
                'CannotInstantiateAbstract error');
    }
}

{
    try {
        const AbstractError = class extends SbError {};
        new AbstractError();
    }
    catch (e) {
        assert(e instanceof SbError.CannotInstantiateAbstract, 'attempting ' +
                'to instantiate abstract error should throw ' +
                'CannotInstantiateAbstract error');
    }
}

{
    const AbstractError = class extends SbError {};
    const ConcreteError =
            class extends AbstractError { static messageTemplate = 'msg'; };
    new ConcreteError();
}

{
	let receivedTemplate;
	let receivedDetails;

	const SubError = class extends SbError {
		static messageTemplate = '{{foo}}';
		static renderMessage (template, details) {
			receivedTemplate = template;
			receivedDetails = details;

			return 'bar';
		}
	};

	const subErrorInstance = new SubError({foo: 5});

	assert.equal(subErrorInstance.message, 'bar',
			'Message reflects custom renderer');
	assert.equal(receivedTemplate, '{{foo}}',
			'Custom renderer received template.');
	assert.deepEqual(receivedDetails, {foo: 5},
			'Custom renderer received details.');
}

{
	const AError = class extends SbError {
        static messageTemplate = '{{foo}}';

        static renderMessage() {
            return 'bar';
        }
    };

	const BError = class extends AError { static messageTemplate = '{{bazz}}' };

	const b = new BError({ foo: 'x', bazz: 'y' });

	assert.equal(b.message, 'bar', 'Subtype inherits templater.');
}

{
	const AbstractError = class extends SbError {
        static renderMessage() {
            return 'foo';
        }
    };

	try {
		new AbstractError();
	}
    catch (e) {
        assert(e instanceof SbError.CannotInstantiateAbstract,
        		'custom templater still does\'t allow instantiation of ' +
        		'abstract error');
    }
}

{
    const A = class extends SbError { static messageTemplate = 'a'; };
    const AbstractError = class extends A {};

    try {
        new AbstractError();
        assert.fail('expected CannotInstantiateAbstract error');
    }
    catch (e) {
        if (e instanceof assert.AssertionError) {
            throw e;
        }

        assert(e instanceof SbError.CannotInstantiateAbstract);
    }
}

console.log('All tests passed.');
