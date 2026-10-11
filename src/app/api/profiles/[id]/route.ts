import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { ProfileModel, serializeProfile } from '@/lib/models/Profile';
import { callerFromRequest, hashSecret } from '@/lib/auth';
import { badId, limited, ownedDoc, unconfigured } from '@/lib/profile-access';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const stop = limited(req);
  if (stop) return stop;
  const unconf = unconfigured();
  if (unconf) return unconf;
  if (badId(params.id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  try {
    await connectMongo();
    const doc = await ProfileModel.findById(params.id).lean();
    if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const owner = (doc.ownerId as string | null | undefined) ?? null;
    if (owner) {
      // Owned profiles open for their owner, or for the profile's own secret.
      const caller = callerFromRequest(req);
      const okOwner = caller.accountId === owner;
      const okSecret =
        !!caller.secret &&
        !!(doc.apiSecretHash as string | null | undefined) &&
        (doc.apiSecretHash as string) === hashSecret(caller.secret);
      if (!okOwner && !okSecret) {
        return NextResponse.json({ error: 'private profile — add ?access_token=YOUR_TOKEN' }, { status: 403 });
      }
    }
    return NextResponse.json({ profile: serializeProfile(doc as never) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const stop = limited(req);
  if (stop) return stop;
  const unconf = unconfigured();
  if (unconf) return unconf;
  if (badId(params.id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  try {
    const r = await ownedDoc(params.id, req);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
    const body = (await req.json()) as Record<string, unknown>;
    if (typeof body.name === 'string' && body.name.trim()) {
      r.doc.name = body.name.trim().slice(0, 80);
    }
    await r.doc.save();
    const fresh = await ProfileModel.findById(params.id).lean();
    return NextResponse.json({ profile: serializeProfile(fresh as never) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const stop = limited(req);
  if (stop) return stop;
  const unconf = unconfigured();
  if (unconf) return unconf;
  if (badId(params.id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  try {
    const r = await ownedDoc(params.id, req);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
    await ProfileModel.findByIdAndDelete(params.id).exec();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}
