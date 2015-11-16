'use strict';
module.exports = detective;
module.exports.metadata = extractMetadataFromResult;

function detective(babel) {
	if (babel.Plugin) {
		return new babel.Plugin('detective', {visitor: {
			ImportDeclaration: function (a, b, c, file) {
				return visitImportDeclaration(this, file.opts.extra.detective, file);
			},
			CallExpression: function (a, b, c, file) {
				return visitCallExpression(this, file.opts.extra.detective, file);
			}
		}});
	}
	return {
		visitor: {
			ImportDeclaration: function (path, state) {
				return visitImportDeclaration(path, state.opts, state.file);
			},
			CallExpression: function (path, state) {
				return visitCallExpression(path, state.opts, state.file);
			}
		}
	};
}

function visitImportDeclaration(path, opts, file) {
	if (includeImports(opts)) {
		addString(file, path.node.source.value);
	}
}

function visitCallExpression(path, opts, file) {
	if (!includeRequire(opts)) {
		return;
	}
	var callee = path.get('callee');
	if (callee.isIdentifier() && callee.node.name === word(opts)) {
		var arg = path.get('arguments.0');
		if (arg && (!arg.isGenerated() || includeGenerated(opts))) {
			if (arg.isLiteral()) {
				addString(file, arg.node.value);
			}	else {
				var loc = addExpression(file, arg.node);
				if (attachExpressionSource(opts)) {
					loc.code = file.code.slice(loc.start, loc.end);
				}
			}
		}
	}
}

function extractMetadataFromResult(result) {
	return result.metadata.requires;
}

function requireMetadata(file) {
	var metadata = file.metadata;
	return metadata.requires || (metadata.requires = {strings: [], expressions: []});
}

function addExpression(state, node) {
	var loc = {start: node.start, end: node.end};
	if (node.loc) {
		loc.loc = {
			start: copyLoc(node.loc.start),
			end: copyLoc(node.loc.end)
		};
	}
	requireMetadata(state).expressions.push(loc);
	return loc;
}

function copyLoc(loc) {
	return loc && {line: loc.line, column: loc.column};
}

function addString(state, string) {
	requireMetadata(state).strings.push(string);
}

// OPTION EXTRACTION:

function word(opts) {
	return (opts && opts.word) || 'require';
}

function includeGenerated(opts) {
	return Boolean(opts && opts.generated);
}

function includeImports(opts) {
	return (!opts || opts.import) !== false;
}

function includeRequire(opts) {
	return (!opts || opts.require) !== false;
}

function attachExpressionSource(opts) {
	return Boolean(opts && opts.source);
}
