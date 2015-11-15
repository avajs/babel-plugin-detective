/* eslint-env node, mocha */

import assert from 'assert';
const babel = require('babel-core/index');
import detective from '../';
import path from 'path';
import fs from 'fs';

function getFixturePath(fixtureFile) {
	return path.resolve(__dirname, 'fixtures', fixtureFile);
}

function getFixtureContents(fixtureFile) {
	return fs.readFileSync(getFixturePath(fixtureFile), 'utf8');
}

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

function replaceExpressions(metadata, file) {
	const contents = getFixtureContents(file);
	metadata.expressions = metadata.expressions.map(loc => contents.slice(loc.start, loc.end));
}

function metadata(parseResult, replaceExp) {
	const metadata = detective.metadata(parseResult);
	if (replaceExp) {
		replaceExpressions(metadata, parseResult.options.filename);
	}
	return metadata;
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

it('works with es2015 preset', () => {
	var parseResult = parseFixture('fixture.js', {presets: ['es2015']});
	assert.deepEqual(metadata(parseResult, true), {
		strings: ['b', 'foo'],
		expressions: [`'foo' + 'bar'`]
	});
});

it('including generated will cause duplicate results', () => {
	var parseResult = parseFixture('fixture.js', {
		presets: ['es2015'],
		plugins: [[detective, {includeGenerated: true}]]
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
	assert.deepEqual(metadata(parseResult, true), {
		strings: ['b', 'baz'],
		expressions: []
	});
});

it('imports can be excluded', () => {
	var parseResult = parseFixture('fixture.js', {
		presets: ['es2015'],
		plugins: [[detective, {includeImport: false}]]
	});
	assert.deepEqual(metadata(parseResult, true), {
		strings: ['foo'],
		expressions: [`'foo' + 'bar'`]
	});
});

it('attachExpressionSource option will automatically attach expression source', () => {
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

it('attachExpressionSource option will automatically attach expression source', () => {
	var parseResult = parseFixture('fixture.js', {
		plugins: [[detective, {includeRequire: false}]]
	});

	assert.deepEqual(metadata(parseResult), {
		strings: ['b'],
		expressions: []
	});
});

