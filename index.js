'use strict';
module.exports = detective;
module.exports.metadata = extractMetadataFromResult;

function detective() {
	return {
		visitor: {
			ImportDeclaration: visitImportDeclaration,
			CallExpression: visitCallExpression
		}
	};
}

function visitImportDeclaration(path, state) {
	if (includeImports(state)) {
		addString(state, path.node.source.value);
	}
}

function visitCallExpression(path, state) {
	if (!includeRequire(state)) {
		return;
	}
	var callee = path.get('callee');
	if (callee.isIdentifier() && callee.node.name === word(state)) {
		var arg = path.get('arguments.0');
		if (arg && (!arg.isGenerated() || includeGenerated(state))) {
			if (arg.isLiteral()) {
				addString(state, arg.node.value);
			}	else {
				var loc = addExpression(state, arg.node);
				if (attachExpressionSource(state)) {
					loc.code = state.file.code.slice(loc.start, loc.end);
				}
			}
		}
	}
}

function extractMetadataFromResult(result) {
	return result.metadata.requires;
}

function requireMetadata(state) {
	var metadata = state.file.metadata;
	return metadata.requires || (metadata.requires = {strings: [], expressions: []});
}

function addExpression(state, node) {
	var loc = {start: node.start, end: node.end};
	requireMetadata(state).expressions.push(loc);
	return loc;
}

function addString(state, string) {
	requireMetadata(state).strings.push(string);
}

// OPTION EXTRACTION:

function word(state) {
	return state.opts.word || 'require';
}

function includeGenerated(state) {
	return Boolean(state.opts.includeGenerated);
}

function includeImports(state) {
	return state.opts.includeImport !== false;
}

function includeRequire(state) {
	return state.opts.includeRequire !== false;
}

function attachExpressionSource(state) {
	return Boolean(state.opts.attachExpressionSource);
}
