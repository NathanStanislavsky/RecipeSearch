import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
let client: MongoClient | null = null;
let isConnected = false;

export async function connectToMongo(): Promise<MongoClient> {
	if (!client) {
		client = new MongoClient(uri);
	}

	if (!isConnected) {
		try {
			await client.connect();
			isConnected = true;
			console.log('Connected to MongoDB');
		} catch (error) {
			console.error('Failed to connect to MongoDB:', error);
			throw error;
		}
	}

	return client;
}

export function getMongoClient(): MongoClient | null {
	return client;
}

connectToMongo().catch(console.error);
