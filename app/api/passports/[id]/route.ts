import { NextRequest, NextResponse } from 'next/server';
import { isMongoConfigured, getMongoDb } from '@/lib/mongodb';
import { DEFAULT_PASSPORT_DATA, normalizePassportData } from '@/lib/passport-data';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isMongoConfigured()) {
      return NextResponse.json({
        success: false,
        source: 'local',
        message: 'MongoDB not configured. Set MONGODB_URI in Settings.',
      });
    }

    const db = await getMongoDb();
    const collection = db.collection('passports');

    const doc = await collection.findOne({ 'general.projectId': id });
    if (!doc) {
      return NextResponse.json(
        { error: `Passport ${id} not found in database.` },
        { status: 404 }
      );
    }

    const { _id, ...rest } = doc as any;
    return NextResponse.json({
      success: true,
      source: 'mongodb',
      passport: normalizePassportData(rest),
    });
  } catch (error: any) {
    console.error('MongoDB GET by ID error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch passport from MongoDB' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isMongoConfigured()) {
      return NextResponse.json({
        success: true,
        source: 'local',
        message: 'MongoDB not configured. Deleted locally.',
      });
    }

    const db = await getMongoDb();
    const collection = db.collection('passports');

    const result = await collection.deleteOne({ 'general.projectId': id });

    return NextResponse.json({
      success: true,
      source: 'mongodb',
      deletedCount: result.deletedCount,
      message: `Passport ${id} deleted from database.`,
    });
  } catch (error: any) {
    console.error('MongoDB DELETE error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete passport from MongoDB' },
      { status: 500 }
    );
  }
}
