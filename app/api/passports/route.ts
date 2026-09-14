import { NextRequest, NextResponse } from 'next/server';
import { isMongoConfigured, getMongoDb } from '@/lib/mongodb';
import { DEFAULT_CATALOG, PassportData, normalizePassportData } from '@/lib/passport-data';

export async function GET() {
  try {
    if (!isMongoConfigured()) {
      return NextResponse.json({
        success: true,
        source: 'local_catalog',
        connected: false,
        passports: DEFAULT_CATALOG,
        message: 'MongoDB not configured. Using default catalog. Add MONGODB_URI in Settings to connect your MongoDB database.',
      });
    }

    const db = await getMongoDb();
    const collection = db.collection<PassportData>('passports');

    const count = await collection.countDocuments();
    if (count === 0) {
      // Seed default catalog to MongoDB
      const docsToInsert = DEFAULT_CATALOG.map(item => ({
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await collection.insertMany(docsToInsert as any[]);
      return NextResponse.json({
        success: true,
        source: 'mongodb',
        connected: true,
        seeded: true,
        passports: DEFAULT_CATALOG,
      });
    }

    const docs = await collection.find({}).sort({ updatedAt: -1 }).toArray();
    const passports = docs.map(doc => {
      // Remove mongo _id if needed or keep it
      const { _id, ...rest } = doc as any;
      return normalizePassportData(rest);
    });

    return NextResponse.json({
      success: true,
      source: 'mongodb',
      connected: true,
      passports,
    });
  } catch (error: any) {
    console.error('MongoDB GET error:', error);
    return NextResponse.json(
      {
        success: false,
        source: 'fallback',
        connected: false,
        error: error?.message || 'Failed to query MongoDB',
        passports: DEFAULT_CATALOG,
      },
      { status: 200 } // Return 200 with fallback so client doesn't crash
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

    if (!isMongoConfigured()) {
      return NextResponse.json({
        success: true,
        source: 'local',
        connected: false,
        passport: normalized,
        warning: 'MongoDB is not configured. Saved locally. Set MONGODB_URI to persist to database.',
      });
    }

    const db = await getMongoDb();
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

    return NextResponse.json({
      success: true,
      source: 'mongodb',
      connected: true,
      passport: normalized,
      message: 'Passport saved to MongoDB database successfully.',
    });
  } catch (error: any) {
    console.error('MongoDB POST error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to save passport to MongoDB',
      },
      { status: 500 }
    );
  }
}
