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

it('works before transform', () => {
	var parseResult = parseFixture('fixture.js', 'before');
	assert.deepEqual(metadata(parseResult, true), {
		strings: ['b', 'foo'],
		expressions: [`'foo' + 'bar'`]
	});
});

it('works after transform', () => {
	var parseResult = parseFixture('fixture.js', 'after');
	assert.deepEqual(metadata(parseResult, true), {
		strings: ['b', 'foo'],
		expressions: [`'foo' + 'bar'`]
	});
});
           /*
it('including generated will cause duplicate results', () => {
	var parseResult = parseFixture('fixture.js', 'before', {includeGenerated: true});
	assert.deepEqual(metadata(parseResult, true), {
		strings: ['b', 'foo'],
		expressions: [`'foo' + 'bar'`]
	});
});          */

it('alternate word', () => {
	var parseResult = parseFixture('fixture.js', 'before', {word: '__dereq__'});
	assert.deepEqual(metadata(parseResult, true), {
		strings: ['b', 'baz'],
		expressions: []
	});
});

it('imports can be excluded', () => {
	var parseResult = parseFixture('fixture.js', 'before', {includeImport: false});
	assert.deepEqual(metadata(parseResult, true), {
		strings: ['foo'],
		expressions: [`'foo' + 'bar'`]
	});
});

it('attachExpressionSource option will automatically attach expression source', () => {
	var parseResult = parseFixture('fixture.js', 'after', {attachExpressionSource: true});

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

it('includeRequire', () => {
	var parseResult = parseFixture('fixture.js', 'before', {includeRequire: false});

	assert.deepEqual(metadata(parseResult), {
		strings: ['b'],
		expressions: []
	});
});

