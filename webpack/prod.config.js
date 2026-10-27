const webpack = require('webpack');
const git = require('git-rev-sync');
const baseConfig = require('./base.config');

// VERSION only tags client error reports, so a tree without git metadata (an
// exported checkout, or a worktree whose gitdir is outside the build container)
// still builds.
function sourceVersion() {
    try {
        return git.long();
    } catch (error) {
        if (!error.message.startsWith('[git-rev-sync]')) throw error;
        console.warn(`${error.message}; building with VERSION "unknown"`);
        return 'unknown';
    }
}

module.exports = {
    ...baseConfig,
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                BROWSER: JSON.stringify(true),
                NODE_ENV: JSON.stringify('production'),
                VERSION: JSON.stringify(sourceVersion())
            }
        }),
        ...baseConfig.plugins,
        // Fix window.onerror
        // See https://github.com/webpack/webpack/issues/5681#issuecomment-345861733
        new webpack.SourceMapDevToolPlugin({
            module: true,
            columns: false,
            moduleFilenameTemplate: info => { return `${info.resourcePath}?${info.loaders}` }
        })
    ]
};
