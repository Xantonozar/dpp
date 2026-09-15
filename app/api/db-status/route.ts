import { NextResponse } from 'next/server';
import { isCloudinaryConfigured } from '@/lib/cloudinary';
import { isMongoConfigured, getMongoDb } from '@/lib/mongodb';
import { getInMemoryPassports } from '@/lib/in-memory-db';

export async function GET() {
  const cloudinaryConfigured = isCloudinaryConfigured();
  const mongoConfigured = isMongoConfigured();
  const inMemoryPassports = getInMemoryPassports();

  let mongoConnected = false;
  let mongoError: string | null = null;
  let passportCount = inMemoryPassports.length;

  if (mongoConfigured) {
    try {
      const db = await getMongoDb();
      // Test ping
      await db.command({ ping: 1 });
      mongoConnected = true;
      const collection = db.collection('passports');
      passportCount = await collection.countDocuments();
    } catch (err: any) {
      mongoConnected = false;
      mongoError = err?.message || 'Connection test failed';
      passportCount = inMemoryPassports.length;
    }
  }

  return NextResponse.json({
    cloudinary: {
      configured: cloudinaryConfigured,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? `${process.env.CLOUDINARY_CLOUD_NAME.slice(0, 3)}***` : null,
      message: cloudinaryConfigured
        ? 'Cloudinary configured and active for direct media uploads.'
        : 'Cloudinary environment variables not set (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
    },
    mongodb: {
      configured: mongoConfigured,
      connected: mongoConnected,
      passportCount,
      dbName: process.env.MONGODB_DB_NAME || 'tchibo_dpp',
      error: mongoError,
      message: mongoConnected
        ? `Connected to MongoDB database with ${passportCount} passport document(s).`
        : mongoConfigured
        ? `MongoDB URI provided but connection failed (${mongoError}). Serving ${passportCount} passport(s) from in-memory store.`
        : `Active in-memory store with ${passportCount} passport(s). Set MONGODB_URI in Settings to connect external MongoDB.`,
    },
  });
}
