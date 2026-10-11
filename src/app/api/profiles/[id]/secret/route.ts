import { NextResponse } from 'next/server';
import { newProfileSecret } from '@/lib/auth';
import { badId, limited, ownedDoc, unconfigured } from '@/lib/profile-access';

export const dynamic = 'force-dynamic';

/** Create (or rotate) this profile's API secret. Plaintext shown ONCE. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const stop = limited(req);
  if (stop) return stop;
  const unconf = unconfigured();
  if (unconf) return unconf;
  if (badId(params.id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  try {
    const r = await ownedDoc(params.id, req);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
    const { secret, hash } = newProfileSecret();
    r.doc.apiSecretHash = hash;
    await r.doc.save();
    return NextResponse.json({ secret }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}

/** Revoke this profile's API secret (existing links stop working). */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const stop = limited(req);
  if (stop) return stop;
  const unconf = unconfigured();
  if (unconf) return unconf;
  if (badId(params.id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  try {
    const r = await ownedDoc(params.id, req);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
    r.doc.apiSecretHash = null;
    await r.doc.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}
