'use strict';

const Hapi = require('@hapi/hapi')
const Vision = require('@hapi/vision')
const Inert = require('@hapi/inert')
const Svelte = require('hapi-svelte-views')
const { join } = require('path')

const init = async () => {

    const server = Hapi.server({
        port: 3030,
        host: 'localhost',
        debug: {
            log: '*',
            request: '*'
        },
        routes: {
            files: {
                relativeTo: join(__dirname, 'public')
            }
        }
    });

    await server.register(Inert);
    await server.register(Vision);

    server.views({
        engines: {
            svelte: Svelte
        },
        relativeTo: __dirname,
        path: 'views'
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return h.view('Home', { name: 'World' });
        }
    })

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true
            }
        }
    })

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();