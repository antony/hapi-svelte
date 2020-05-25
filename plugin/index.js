'use strict';

const Hoek = require('@hapi/hoek');
const { join, dirname } = require('path');
const { readFile } = require('fs/promises')
const build = require('./rollup-runtime');

const DEFAULTS = {
    doctype: '<!DOCTYPE html>',
    removeCache: process.env.NODE_ENV !== 'production',
    removeCacheRegExp: undefined,
    layout: undefined,
    layoutPath: undefined
};

const compile = function compile(template, compileOpts) {
    compileOpts = Hoek.applyToDefaults(DEFAULTS, compileOpts);

    return async function runtime(context, renderOpts) {
        renderOpts = Hoek.applyToDefaults(compileOpts, renderOpts);

        const template = await readFile(join(dirname(renderOpts.filename), 'template.html'), 'utf8')
        const ssr = new Function(await build(renderOpts.filename, true) + ';return app')
        const { css, html, head } = ssr().render()

        const js = await build(renderOpts.filename, false)

        const output = template
            .replace('%SSR_HEAD%', head)
            .replace('%SSR_CSS%', css.code)
            .replace('%SSR_HTML%', html)
            .replace('%SCRIPTS%', `<script async defer>${js}</script>`)

        /*
         * Transpilers tend to take a while to start up. Here we delete the
         * view and layout modules (and any modules matching the
         * `removeCacheRegExp` pattern) from the require cache so we don't need
         * to restart the app to see view changes.
         */
        if (renderOpts.removeCache) {
            if (renderOpts.layout) {
                const layoutKey = require.resolve(layoutPath);
                delete require.cache[layoutKey];
            }

            const viewKey = require.resolve(renderOpts.filename);
            delete require.cache[viewKey];

            if (renderOpts.removeCacheRegExp) {
                const regexp = new RegExp(renderOpts.removeCacheRegExp);

                Object.keys(require.cache).forEach((cacheKey) => {
                    if (regexp.test(cacheKey)) {
                        delete require.cache[cacheKey];
                    }
                });
            }
        }

        return output
    }
}

module.exports = {
    compile
}
