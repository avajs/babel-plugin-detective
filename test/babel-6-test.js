/* eslint-env node, mocha */
import assert from 'assert';
import * as babel from 'babel-core';
import detective from '../';
import {getFixturePath, metadata} from './_utils';

function parseFixture(fixtureFile, opts) {
	opts = opts || {};
	const presets = opts.presets || [];
	const plugins = opts.plugins || [[detective, opts]];
	const babelOpts = {
		presets: presets,
		plugins: plugins
	};

	return babel.transformFileSync(getFixturePath(fixtureFile), babelOpts);
}

describe('babel-6', function () {
	it('produces a list of expressions', () => {
		assert.deepEqual(metadata(parseFixture('fixture.js')), {
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
	});

	it('works with es2015 preset', () => {
		var parseResult = parseFixture('fixture.js', {presets: ['es2015']});
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

	it('including generated will cause duplicate results (one from the import, one from the generated require)', () => {
		var parseResult = parseFixture('fixture.js', {
			presets: ['es2015'],
			plugins: [[detective, {generated: true}]]
		});
		assert.deepEqual(metadata(parseResult), {
			strings: ['b', 'foo', 'b'],
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
			strings: ['b', 'foo', 'b'],
			expressions: [`'foo' + 'bar'`]
		});
	});

	it('alternate word', () => {
		var parseResult = parseFixture('fixture.js', {
			presets: ['es2015'],
			plugins: [[detective, {word: '__dereq__'}]]
		});
		assert.deepEqual(metadata(parseResult), {
			strings: ['b', 'baz'],
			expressions: []
		});
	});

	it('import statements can be excluded', () => {
		var parseResult = parseFixture('fixture.js', {
			presets: ['es2015'],
			plugins: [[detective, {import: false}]]
		});
		assert.deepEqual(metadata(parseResult, true), {
			strings: ['foo'],
			expressions: [`'foo' + 'bar'`]
		});
	});

	it('require statements can be excluded', () => {
		var parseResult = parseFixture('fixture.js', {
			plugins: [[detective, {require: false}]]
		});

		assert.deepEqual(metadata(parseResult), {
			strings: ['b'],
			expressions: []
		});
	});

	it('attachExpressionSource attaches code to location object', () => {
		var parseResult = parseFixture('fixture.js', {
			plugins: [[detective, {source: true}]]
		});

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
		const data = metadata(parseFixture('fixture.js', {
			plugins: [[detective, {nodes: true}]]
		}));
		const strings = data.strings;
		const expressions = data.expressions;

		assert.strictEqual(strings.length, 2);
		assert.strictEqual(strings[0].type, 'StringLiteral');
		assert.strictEqual(strings[0].value, 'b');
		assert.strictEqual(strings[1].type, 'StringLiteral');
		assert.strictEqual(strings[1].value, 'foo');

		assert.strictEqual(expressions.length, 1);
		assert.strictEqual(expressions[0].type, 'BinaryExpression');
		assert.strictEqual(expressions[0].code, undefined);
		assert.strictEqual(expressions[0].operator, '+');
		assert.strictEqual(expressions[0].left.type, 'StringLiteral');
		assert.strictEqual(expressions[0].left.value, 'foo');
		assert.strictEqual(expressions[0].right.type, 'StringLiteral');
		assert.strictEqual(expressions[0].right.value, 'bar');
	});

	it('attach source to nodes', () => {
		const data = metadata(parseFixture('fixture.js', {
			plugins: [[detective, {nodes: true, source: true}]]
		}));
		const expressions = data.expressions;

		assert.strictEqual(expressions.length, 1);
		assert.strictEqual(expressions[0].type, 'BinaryExpression');
		assert.strictEqual(expressions[0].code, `'foo' + 'bar'`);
	});

	it('handles exports', () => {
		const {strings} = metadata(parseFixture('exports.js', {
			presets: ['es2015']
		}));

		assert.deepEqual(strings, ['./foo', './quz', './goodbye']);
	});
});
