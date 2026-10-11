import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongo, isMongoConfigured } from '@/lib/mongo';
import { ProfileModel } from '@/lib/models/Profile';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json({ mongo: 'unconfigured', profiles: 0 });
  }
  try {
    await connectMongo();
    const profiles = await ProfileModel.countDocuments();
    const state = mongoose.connection.readyState; // 1 = connected
    return NextResponse.json({ mongo: state === 1 ? 'connected' : 'connecting', profiles });
  } catch (e) {
    return NextResponse.json(
      { mongo: 'error', detail: e instanceof Error ? e.message : 'db error' },
      { status: 500 },
    );
  }
}
