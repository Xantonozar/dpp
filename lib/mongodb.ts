import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const currentUri = process.env.MONGODB_URI;
  if (!currentUri) {
    throw new Error('MONGODB_URI environment variable is required to connect to MongoDB.');
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so the MongoClient is not repeated
    if (!global._mongoClientPromise) {
      client = new MongoClient(currentUri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable
    if (!clientPromise) {
      client = new MongoClient(currentUri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

export async function getMongoDb(): Promise<Db> {
  const mongoClient = await getMongoClientPromise();
  const dbName = process.env.MONGODB_DB_NAME || 'tchibo_dpp';
  return mongoClient.db(dbName);
}
