// Server-only MongoDB connection with serverless-friendly caching.
// Reads MONGODB_URI (Atlas). Absent -> callers must degrade gracefully.
import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var __klMongo: Promise<typeof mongoose> | undefined;
}

export function isMongoConfigured(): boolean {
  return !!process.env.MONGODB_URI;
}

export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  if (!globalThis.__klMongo) {
    globalThis.__klMongo = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB ?? 'kundali',
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
  }
  return globalThis.__klMongo;
}
