import mongoose from 'mongoose';

async function connectDatabase() {
	const mongoUri = process.env.MONGODB_URI;

	if (!mongoUri) {
		throw new Error('MONGODB_URI is not defined');
	}

	await mongoose.connect(mongoUri);

	return mongoose.connection;
}

export default connectDatabase;
// TODO: implement\n