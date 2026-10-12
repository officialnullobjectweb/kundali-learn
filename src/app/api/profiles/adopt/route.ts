import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectMongo, isMongoConfigured } from '@/lib/mongo';
import { ProfileModel } from '@/lib/models/Profile';
import { authOptions } from '@/lib/auth-options';
import { isUuidLike } from '@/lib/auth';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Claim anonymous device charts into the logged-in account. Moves every
 * profile owned by `fromOwnerId` (the browser id) onto the session user,
 * so nobody recreates anything after signing in.
 */
export async function POST(req: Request) {
  const ip = checkRateLimit(`api:ip:${clientIp(req)}`, 240, 60_000);
  if (!ip.ok) return NextResponse.json({ error: 'rate limit — slow down' }, { status: 429 });
  if (!isMongoConfigured()) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  try {
    const session = await getServerSession(authOptions);
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (!uid) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
    const body = (await req.json()) as Record<string, unknown>;
    const from = typeof body.fromOwnerId === 'string' && isUuidLike(body.fromOwnerId) ? body.fromOwnerId : null;
    if (!from || from === uid) return NextResponse.json({ adopted: 0 });
    await connectMongo();
    const r = await ProfileModel.updateMany({ ownerId: from }, { $set: { ownerId: uid } }).exec();
    return NextResponse.json({ adopted: r.modifiedCount ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}
