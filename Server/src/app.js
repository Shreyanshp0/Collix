import express from 'express';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
	res.json({ success: true, message: 'OK', data: {} });
});

app.use('/api/auth', authRoutes);

app.use((req, res) => {
	res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;
// TODO: implement\n