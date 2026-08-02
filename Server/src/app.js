import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import groupRoutes from './routes/group.routes.js';
import messageRoutes from './routes/message.routes.js';
import documentRoutes from './routes/document.routes.js';
import aiRoutes from './routes/ai.routes.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: [clientUrl, 'http://localhost:5173'], credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
	res.json({ success: true, message: 'OK', data: { status: 'healthy' } });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', groupRoutes);
app.use('/api/v1', messageRoutes);
app.use('/api/v1', documentRoutes);
app.use('/api/v1', aiRoutes);

app.use((req, res) => {
	res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorMiddleware);

export default app;