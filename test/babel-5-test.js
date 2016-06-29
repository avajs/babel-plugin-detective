/* eslint-env node, mocha */
import assert from 'assert';
const babel = require('babel');
import detective from '../';
import {getFixturePath, metadata} from './_utils';

function parseFixture(fixtureFile, position, opts) {
	var path = getFixturePath(fixtureFile);
	var result = babel.transformFileSync(path, {
		plugins: [{transformer: detective, position: position}],
		extra: {
			detective: opts || {}
		}
	});

	result.options = {filename: path};

	return result;
}

describe('babel-5', function () {
	it('produces a list of expressions', () => {
		const parseResult = parseFixture('fixture.js');
		assert.deepEqual(metadata(parseResult), {
			strings: ['b', 'foo'],
			expressions: [{
				start: 60,
				end: 73,
				loc: {
					start: {
						line: 7,
						column: 8
					},
					end: {
						line: 7,
						column: 21
					}
				}
			}]
		});
		assert.deepEqual(metadata(parseResult, true), {
			strings: ['b', 'foo'],
			expressions: [`'foo' + 'bar'`]
		});
	});

	it('before builtin plugins', () => {
		const parseResult = parseFixture('fixture.js', 'before');
		assert.deepEqual(metadata(parseResult), {
			strings: ['b', 'foo'],
			expressions: [{
				start: 60,
				end: 73,
				loc: {
					start: {
						line: 7,
						column: 8
					},
					end: {
						line: 7,
						column: 21
					}
				}
			}]
		});
		assert.deepEqual(metadata(parseResult, true), {
			strings: ['b', 'foo'],
			expressions: [`'foo' + 'bar'`]
		});
	});

	it('after builtin plugins', () => {
		const parseResult = parseFixture('fixture.js', 'after');
		assert.deepEqual(metadata(parseResult), {
			strings: ['b', 'foo'],
			expressions: [{
				start: 60,
				end: 73,
				loc: {
					start: {
						line: 7,
						column: 8
					},
					end: {
						line: 7,
						column: 21
					}
				}
			}]
		});
		assert.deepEqual(metadata(parseResult, true), {
			strings: ['b', 'foo'],
			expressions: [`'foo' + 'bar'`]
		});
	});

	it('alternate word', () => {
		const parseResult = parseFixture('fixture.js', 'before', {word: '__dereq__'});
		assert.deepEqual(metadata(parseResult), {
			strings: ['b', 'baz'],
			expressions: []
		});
	});

	it('imports can be excluded', () => {
		const parseResult = parseFixture('fixture.js', 'before', {import: false});
		assert.deepEqual(metadata(parseResult, true), {
			strings: ['foo'],
			expressions: [`'foo' + 'bar'`]
		});
	});

	it('require statements can be excluded', () => {
		const parseResult = parseFixture('fixture.js', 'before', {require: false});

		assert.deepEqual(metadata(parseResult), {
			strings: ['b'],
			expressions: []
		});
	});

	it('attachExpressionSource attaches code to location object', () => {
		const parseResult = parseFixture('fixture.js', 'after', {source: true});

		assert.deepEqual(metadata(parseResult), {
			strings: ['b', 'foo'],
			expressions: [{
				start: 60,
				end: 73,
				code: `'foo' + 'bar'`,
				loc: {
					start: {
						line: 7,
						column: 8
					},
					end: {
						line: 7,
						column: 21
					}
				}
			}]
		});
	});

	it('options.nodes', () => {
		const data = metadata(parseFixture('fixture.js', 'after', {nodes: true}));
		const strings = data.strings;
		const expressions = data.expressions;

		assert.strictEqual(strings.length, 2);
		assert.strictEqual(strings[0].type, 'Literal');
		assert.strictEqual(strings[0].value, 'b');
		assert.strictEqual(strings[1].type, 'Literal');
		assert.strictEqual(strings[1].value, 'foo');

		assert.strictEqual(expressions.length, 1);
		assert.strictEqual(expressions[0].type, 'BinaryExpression');
		assert.strictEqual(expressions[0].code, undefined);
		assert.strictEqual(expressions[0].operator, '+');
		assert.strictEqual(expressions[0].left.type, 'Literal');
		assert.strictEqual(expressions[0].left.value, 'foo');
		assert.strictEqual(expressions[0].right.type, 'Literal');
		assert.strictEqual(expressions[0].right.value, 'bar');
	});

	it('options.nodes', () => {
		const data = metadata(parseFixture('fixture.js', 'after', {nodes: true, source: true}));
		const expressions = data.expressions;

		assert.strictEqual(expressions.length, 1);
		assert.strictEqual(expressions[0].type, 'BinaryExpression');
		assert.strictEqual(expressions[0].code, `'foo' + 'bar'`);
	});
});
