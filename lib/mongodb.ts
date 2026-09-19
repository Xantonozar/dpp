import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 2500,
  connectTimeoutMS: 2500,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let cachedDbName: string | null = null;

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

export function getResolvedDbName(): string {
  return cachedDbName || process.env.MONGODB_DB_NAME || 'tchibo_dpp';
}

export async function getMongoDb(): Promise<Db> {
  const mongoClient = await getMongoClientPromise();

  if (cachedDbName) {
    return mongoClient.db(cachedDbName);
  }

  const targetName = (process.env.MONGODB_DB_NAME || 'tchibo_dpp').trim();

  // Try to find the matching database with case-insensitivity on the cluster
  // (Prevents MongoBulkWriteError: db already exists with different case already have: [Dpp] trying to create [dpp])
  try {
    const adminDb = mongoClient.db().admin();
    const dbsResult = await adminDb.listDatabases();
    const existingDbs = dbsResult.databases || [];

    // 1. Exact match
    const exact = existingDbs.find((d) => d.name === targetName);
    if (exact) {
      cachedDbName = exact.name;
      return mongoClient.db(cachedDbName);
    }

    // 2. Case-insensitive match
    const caseMatch = existingDbs.find(
      (d) => d.name.toLowerCase() === targetName.toLowerCase()
    );
    if (caseMatch) {
      cachedDbName = caseMatch.name;
      return mongoClient.db(cachedDbName);
    }
  } catch {
    // If admin().listDatabases() fails (e.g. restricted permissions), proceed with configured name
  }

  cachedDbName = targetName;
  return mongoClient.db(cachedDbName);
}

/**
 * Executes a database operation with automatic recovery if a case-mismatch error occurs.
 */
export async function withMongoDb<T>(operation: (db: Db) => Promise<T>): Promise<T> {
  const db = await getMongoDb();
  try {
    return await operation(db);
  } catch (error: any) {
    // Check if error is due to database casing mismatch:
    // e.g. "db already exists with different case already have: [Dpp] trying to create [dpp]"
    const message = error?.message || '';
    const caseMatch = message.match(/already have:\s*\[([^\]]+)\]/i);
    if (caseMatch && caseMatch[1]) {
      const correctDbName = caseMatch[1].trim();
      cachedDbName = correctDbName;
      const mongoClient = await getMongoClientPromise();
      const correctedDb = mongoClient.db(correctDbName);
      return await operation(correctedDb);
    }
    throw error;
  }
}
