import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectMongo, isMongoConfigured } from '@/lib/mongo';
import { UserModel } from '@/lib/models/User';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** Create an email+password account. Then sign in normally. */
export async function POST(req: Request) {
  const ip = checkRateLimit(`api:ip:${clientIp(req)}`, 240, 60_000);
  if (!ip.ok) return NextResponse.json({ error: 'rate limit — slow down' }, { status: 429 });
  if (!isMongoConfigured()) return NextResponse.json({ error: 'unconfigured' }, { status: 503 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'valid email is required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'password needs 8+ characters' }, { status: 400 });
    }
    await connectMongo();
    const exists = await UserModel.findOne({ email }).select('_id').lean();
    if (exists) return NextResponse.json({ error: 'email already registered' }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 10);
    const doc = await UserModel.create({ name, email, passwordHash });
    return NextResponse.json({ ok: true, id: String(doc._id) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}
