import dotenv from 'dotenv';
import { createServer } from 'node:http';
import connectDatabase from './src/config/database.js';
import app from './src/app.js';
import { initializeSocketServer } from './src/socket/index.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
	await connectDatabase();
	const httpServer = createServer(app);
	initializeSocketServer(httpServer);
	httpServer.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

startServer().catch((error) => {
	console.error('Failed to start server:', error);
	process.exit(1);
});
// TODO: implement\n
