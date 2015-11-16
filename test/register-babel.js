require('babel-core/register')({
	presets: [
		'stage-3',
		'es2015'
	],
	only: ['_utils.js', '*-test.js']
});
