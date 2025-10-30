import { Hono } from 'hono';
import { openAPIConfig } from '../config/openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { allRoutes } from '../all.routes';
import { registerRoutes } from '../adapters/registerRouters.adapter';
import { env } from '../config/env';
export const createHonoApp = () => {
	const app = new Hono({
		// Explicitly set the environment type for Cloudflare Workers
		strict: true,
	});
	
	const framework = env.framework;

	// Apply optional route prefixes before handing configuration to Hono.
	registerRoutes(app, allRoutes, framework, { prefix: env.routePrefix });

	configureOpenapi(app, framework, 'scalar');

	app.onError((err, c) => {
		console.error(err);
		return c.json({ error: 'Internal Server Error' }, 500);
	});

	return app;
};

export function configureOpenapi(app: any, framework: 'express' | 'hono' | 'fastify' | 'nest', ui: 'swagger' | 'scalar') {
	// Serve OpenAPI JSON
	if (framework === 'express') {
		app.get('/doc', (req: any, res: any) => res.json(openAPIConfig));
	} else if (framework === 'hono') {
		app.get('/doc', (c: any) => c.json(openAPIConfig));
	} else if (framework === 'fastify') {
		app.get('/doc', async (req: any, reply: any) => reply.send(openAPIConfig));
	}

	// Serve API Reference UI
	if (ui === 'swagger') {
		app.get('/reference', (req: any, res: any) => {
			res.send(
				`<html><body>
            <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js"></script>
            <script>
              window.onload = function() {
                const ui = SwaggerUIBundle({
                  url: '/doc',
                  dom_id: '#swagger-ui',
                  presets: [SwaggerUIBundle.presets.apis],
                  layout: 'BaseLayout'
                });
                window.ui = ui;
              }
            </script>
            <div id="swagger-ui"></div>
          </body></html>`
			);
		});
	} else if (ui === 'scalar') {
		app.get(
			'/reference',
			apiReference({
				// Use Kepler theme for modern look
				theme: 'kepler',
				// Use classic layout for better readability
				layout: 'classic',
				// Configure default HTTP client settings
				defaultHttpClient: {
					targetKey: 'javascript',
					clientKey: 'fetch', // Use fetch as default client
				},
				// Hide unnecessary HTTP clients to reduce clutter
				// Only show JavaScript fetch client
				hiddenClients: [
					'libcurl',
					'clj_http',
					'httpclient',
					'restsharp',
					'native',
					'http1.1',
					'asynchttp',
					'nethttp',
					'okhttp',
					'unirest',
					'xhr',
					'jquery',
					'okhttp',
					'native',
					'request',
					'unirest',
					'nsurlsession',
					'cohttp',
					'curl',
					'guzzle',
					'http1',
					'http2',
					'webrequest',
					'restmethod',
					'python3',
					'requests',
					'httr',
					'native',
					'httpie',
					'wget',
					'nsurlsession',
					'undici',
					'http',
					'ofetch',
					'got',
					'axios',
					'node-fetch',
				],
				// Specify where to fetch the OpenAPI specification
				spec: {
					url: '/doc', // Points to the doc endpoint defined above
				},
			})
		);
	}
}
