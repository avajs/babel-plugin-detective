import fs from 'fs';
import path from 'path';
import detective from '../';

export function getFixturePath(fixtureFile) {
	return path.resolve(__dirname, 'fixtures', fixtureFile);
}

export function getFixtureContents(fixtureFile) {
	return fs.readFileSync(getFixturePath(fixtureFile), 'utf8');
}

export function replaceExpressions(metadata, file) {
	const contents = getFixtureContents(file);
	metadata.expressions = metadata.expressions.map(loc => contents.slice(loc.start, loc.end));
}

export function metadata(parseResult, replaceExp) {
	const metadata = detective.metadata(parseResult);
	if (replaceExp) {
		replaceExpressions(metadata, parseResult.options.filename);
	}
	return metadata;
}
