import { NextRequest, NextResponse } from 'next/server';
import { isMongoConfigured, getMongoDb, withMongoDb } from '@/lib/mongodb';
import { PassportData, normalizePassportData } from '@/lib/passport-data';
import { getInMemoryPassports, saveInMemoryPassport, clearInMemoryPassports } from '@/lib/in-memory-db';

export async function GET() {
  try {
    if (!isMongoConfigured()) {
      const inMemory = getInMemoryPassports();
      return NextResponse.json({
        success: true,
        source: 'in_memory',
        connected: false,
        passports: inMemory,
        message: 'Running with in-memory store. Set MONGODB_URI in Settings to connect MongoDB.',
      });
    }

    const { passports } = await withMongoDb(async (db) => {
      const collection = db.collection<PassportData>('passports');
      const docs = await collection.find({}).sort({ updatedAt: -1 }).toArray();
      const list = docs.map((doc) => {
        const { _id, ...rest } = doc as any;
        return normalizePassportData(rest);
      });

      return { passports: list };
    });

    return NextResponse.json({
      success: true,
      source: 'mongodb',
      connected: true,
      passports,
    });
  } catch (error: any) {
    console.error('MongoDB GET error, falling back to in-memory store:', error);
    const inMemory = getInMemoryPassports();
    return NextResponse.json(
      {
        success: true,
        source: 'in_memory_fallback',
        connected: false,
        error: error?.message || 'Failed to query MongoDB',
        passports: inMemory,
      },
      { status: 200 }
    );
  }
}

export async function DELETE() {
  try {
    clearInMemoryPassports();

    if (!isMongoConfigured()) {
      return NextResponse.json({
        success: true,
        source: 'in_memory',
        message: 'All passports cleared from in-memory store.',
      });
    }

    try {
      const result = await withMongoDb(async (db) => {
        const collection = db.collection('passports');
        return await collection.deleteMany({});
      });

      return NextResponse.json({
        success: true,
        source: 'mongodb',
        deletedCount: result.deletedCount,
        message: 'All passports cleared from database.',
      });
    } catch (dbErr: any) {
      console.warn('MongoDB DELETE ALL error:', dbErr);
      return NextResponse.json({
        success: true,
        source: 'in_memory_fallback',
        message: 'Cleared from in-memory store (MongoDB unreachable).',
      });
    }
  } catch (error: any) {
    console.error('Passports DELETE ALL error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete passports' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPassport = body.passport || body;

    if (!rawPassport?.general?.projectId) {
      return NextResponse.json(
        { error: 'Invalid passport data. Missing general.projectId.' },
        { status: 400 }
      );
    }

    const normalized = normalizePassportData(rawPassport);
    saveInMemoryPassport(normalized);

    if (!isMongoConfigured()) {
      return NextResponse.json({
        success: true,
        source: 'in_memory',
        connected: false,
        passport: normalized,
        message: 'Saved to in-memory store. Set MONGODB_URI to persist to external database.',
      });
    }

    try {
      await withMongoDb(async (db) => {
        const collection = db.collection('passports');
        const projectId = normalized.general.projectId;

        await collection.updateOne(
          { 'general.projectId': projectId },
          {
            $set: {
              ...normalized,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      });

      return NextResponse.json({
        success: true,
        source: 'mongodb',
        connected: true,
        passport: normalized,
        message: 'Passport saved to MongoDB database successfully.',
      });
    } catch (dbError: any) {
      console.warn('MongoDB save failed, saved to in-memory store:', dbError);
      return NextResponse.json({
        success: true,
        source: 'in_memory',
        connected: false,
        passport: normalized,
        warning: 'MongoDB connection failed; saved to in-memory store.',
      });
    }
  } catch (error: any) {
    console.error('Passports POST error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to save passport',
      },
      { status: 500 }
    );
  }
}
