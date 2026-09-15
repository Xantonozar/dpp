import { NextRequest, NextResponse } from 'next/server';
import { isMongoConfigured, getMongoDb } from '@/lib/mongodb';
import { normalizePassportData } from '@/lib/passport-data';
import { getInMemoryPassportById, deleteInMemoryPassport } from '@/lib/in-memory-db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isMongoConfigured()) {
      const inMemory = getInMemoryPassportById(id);
      if (inMemory) {
        return NextResponse.json({
          success: true,
          source: 'in_memory',
          passport: inMemory,
        });
      }
      return NextResponse.json(
        { error: `Passport ${id} not found.` },
        { status: 404 }
      );
    }

    try {
      const db = await getMongoDb();
      const collection = db.collection('passports');

      const doc = await collection.findOne({ 'general.projectId': id });
      if (!doc) {
        const inMemory = getInMemoryPassportById(id);
        if (inMemory) {
          return NextResponse.json({
            success: true,
            source: 'in_memory',
            passport: inMemory,
          });
        }
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
    } catch (dbErr) {
      console.warn('MongoDB GET by ID error, checking in-memory store:', dbErr);
      const inMemory = getInMemoryPassportById(id);
      if (inMemory) {
        return NextResponse.json({
          success: true,
          source: 'in_memory_fallback',
          passport: inMemory,
        });
      }
      return NextResponse.json(
        { error: `Passport ${id} not found.` },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Passports GET by ID error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch passport' },
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
    const deletedInMemory = deleteInMemoryPassport(id);

    if (!isMongoConfigured()) {
      return NextResponse.json({
        success: true,
        source: 'in_memory',
        deletedCount: deletedInMemory ? 1 : 0,
        message: `Passport ${id} deleted from in-memory store.`,
      });
    }

    try {
      const db = await getMongoDb();
      const collection = db.collection('passports');

      const result = await collection.deleteOne({ 'general.projectId': id });

      return NextResponse.json({
        success: true,
        source: 'mongodb',
        deletedCount: result.deletedCount,
        message: `Passport ${id} deleted from database.`,
      });
    } catch (dbErr) {
      console.warn('MongoDB DELETE error, deleted from in-memory store:', dbErr);
      return NextResponse.json({
        success: true,
        source: 'in_memory_fallback',
        deletedCount: deletedInMemory ? 1 : 0,
        message: `Passport ${id} deleted from in-memory store (MongoDB unreachable).`,
      });
    }
  } catch (error: any) {
    console.error('Passports DELETE error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete passport' },
      { status: 500 }
    );
  }
}
