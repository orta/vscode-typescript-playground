/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
'use strict';

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const path = require('path');
const webpack = require('webpack');

/** @type WebpackConfig */
const webExtensionConfig = {
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
	target: 'webworker', // extensions run in a webworker context
	entry: {
		'extension': './src/web/extension.ts',
		'webview': './src/webview/index.ts',
		'tsworker': './src/tsworker/index.ts',
		'test/suite/index': './src/web/test/suite/index.ts'
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, './dist/web'),
		libraryTarget: 'commonjs',
		devtoolModuleFilenameTemplate: '../../[resource-path]'
	},
	resolve: {
		mainFields: ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
		extensions: ['.ts', '.js'], // support ts-files and js-files
		alias: {
			// provides alternate implementation for node module and source files
		},
		fallback: {
			// Webpack 5 no longer polyfills Node.js core modules automatically.
			// see https://webpack.js.org/configuration/resolve/#resolvefallback
			// for the list of Node.js core module polyfills.
			'assert': require.resolve('assert')
		}
	},
	module: {
		rules: [{
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader'
			}]
		}]
	},
	plugins: [
		new webpack.ProvidePlugin({
			process: 'process/browser', // provide a shim for the global `process` variable
		}),
		// The webview.js is running in a script context and has no access to `exports`, so drop it
		new FindReplacePlugin({
			src: 'dist/web/webview.js',
			dest: 'dist/web/webview.js',
			rules: [{ find: /= exports;/g, replace: () =>  "= {}" }]
		})

	],
	externals: {
		'vscode': 'commonjs vscode', // ignored because it doesn't exist
	},
	performance: {
		hints: false
	},
	devtool: 'nosources-source-map' // create a source map that points to the original source file
};

module.exports = [ webExtensionConfig ];

// Modified from https://github.com/luwes/find-replace-webpack-plugin/ which is MIT, changes:
// https://github.com/luwes/find-replace-webpack-plugin/pull/1

const fs = require('fs');

function FindReplacePlugin(options = {}) {
	this.src = options.src;
	this.dest = options.dest;
	this.rules = options.rules;
};

FindReplacePlugin.prototype.apply = function(compiler) {
	/** @type {import("webpack").Compiler} */
	const c = compiler

	const folder = compiler.options.context;
	const src = path.join(folder, this.src);
	const dest = path.join(folder, this.dest);

	c.hooks.done.tap('find-replace', (statsData) => {
			const stats = statsData.toJson();
			let template = fs.readFileSync(src, 'utf8');
			template = this.rules.reduce(
				(template, rule) => template.replace(
					rule.find, rule.replace.bind(global, stats)
				),
				template
			);
			fs.writeFileSync(dest, template);
	});
};
