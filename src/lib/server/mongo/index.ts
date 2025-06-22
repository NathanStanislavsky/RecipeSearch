import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

let isConnected = false;

export async function connectToMongo() {
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

export async function closeMongoConnection() {
  if (isConnected) {
    try {
      await client.close();
      isConnected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }
}

export function getMongoClient() {
  return client;
}
