import { NextResponse } from 'next/server';
import { badId, limited, ownedDoc, unconfigured } from '@/lib/profile-access';

export const dynamic = 'force-dynamic';

/** Rename / re-gender / mark-self one native. */
export async function PUT(req: Request, { params }: { params: { id: string; nid: string } }) {
  const stop = limited(req);
  if (stop) return stop;
  const unconf = unconfigured();
  if (unconf) return unconf;
  if (badId(params.id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  try {
    const r = await ownedDoc(params.id, req);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
    const natives = (r.doc.natives as unknown[] as Record<string, unknown>[]);
    const n = natives.find((x) => x.nid === params.nid);
    if (!n) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;
    if (typeof body.name === 'string' && body.name.trim()) n.name = body.name.trim().slice(0, 80);
    if (typeof body.gender === 'string' && ['male', 'female', 'other', ''].includes(body.gender)) {
      n.gender = body.gender;
    }
    if (body.isSelf === true) {
      for (const x of natives) x.isSelf = x.nid === params.nid;
    }
    await r.doc.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; nid: string } }) {
  const stop = limited(req);
  if (stop) return stop;
  const unconf = unconfigured();
  if (unconf) return unconf;
  if (badId(params.id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  try {
    const r = await ownedDoc(params.id, req);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
    r.doc.natives = ((r.doc.natives as unknown[] as Record<string, unknown>[]).filter(
      (x) => x.nid !== params.nid,
    )) as never;
    await r.doc.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}
