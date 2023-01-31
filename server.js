import express from 'express';
import { createServer } from 'http';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = createServer(app);

async function start() {
	// Create Vite server in middleware mode and configure the app type as
	// 'custom', disabling Vite's own HTML serving logic so parent server
	// can take control
	const vite = await createViteServer({
		server: {
			middlewareMode: true
		},
		appType: 'spa'
	});

	// use vite's connect instance as middleware
	// if you use your own express router (express.Router()), you should use router.use
	app.use(vite.middlewares);

	app.use('*', async (req, res) => {
		console.log('Started');
	});

	server.listen(3000, () => {
		console.log('Сервер запущен');
	});
}

start();
