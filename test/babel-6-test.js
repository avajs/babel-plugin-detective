/* eslint-env node, mocha */

import assert from 'assert';
const babel = require('babel-core');
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
			plugins: [[detective, {includeGenerated: true}]]
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
			plugins: [[detective, {includeImport: false}]]
		});
		assert.deepEqual(metadata(parseResult, true), {
			strings: ['foo'],
			expressions: [`'foo' + 'bar'`]
		});
	});

	it('require statements can be excluded', () => {
		var parseResult = parseFixture('fixture.js', {
			plugins: [[detective, {includeRequire: false}]]
		});

		assert.deepEqual(metadata(parseResult), {
			strings: ['b'],
			expressions: []
		});
	});

	it('attachExpressionSource attaches code to location object', () => {
		var parseResult = parseFixture('fixture.js', {
			plugins: [[detective, {attachExpressionSource: true}]]
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
});
