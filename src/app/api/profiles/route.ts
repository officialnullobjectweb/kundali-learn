import { NextResponse } from 'next/server';
import { connectMongo, isMongoConfigured } from '@/lib/mongo';
import { ProfileModel, serializeProfile } from '@/lib/models/Profile';
import { isUuidLike } from '@/lib/auth';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function limited(req: Request): NextResponse | null {
  const r = checkRateLimit(`api:ip:${clientIp(req)}`, 240, 60_000);
  return r.ok ? null : NextResponse.json({ error: 'rate limit — slow down' }, { status: 429 });
}

/** Lists ONLY the caller's own profiles. No owner -> empty (never global). */
export async function GET(req: Request) {
  const stop = limited(req);
  if (stop) return stop;
  if (!isMongoConfigured()) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  const owner = new URL(req.url).searchParams.get('owner');
  if (!owner || !isUuidLike(owner)) return NextResponse.json({ profiles: [] });
  try {
    await connectMongo();
    const docs = await ProfileModel.find({ ownerId: owner }).sort({ updatedAt: -1 }).limit(50).lean();
    return NextResponse.json({ profiles: docs.map((d) => serializeProfile(d as never)) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}

/** Create an empty profile container owned by one account. */
export async function POST(req: Request) {
  const stop = limited(req);
  if (stop) return stop;
  if (!isMongoConfigured()) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const ownerId = typeof body.ownerId === 'string' && isUuidLike(body.ownerId) ? body.ownerId : null;
    if (!ownerId) return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
    const name = typeof body.name === 'string' && body.name.trim()
      ? body.name.trim().slice(0, 80)
      : 'My Family';
    await connectMongo();
    const doc = await ProfileModel.create({ name, ownerId, natives: [] });
    return NextResponse.json({ profile: serializeProfile(doc) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}
