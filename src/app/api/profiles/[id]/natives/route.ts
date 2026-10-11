import { NextResponse } from 'next/server';
import { badId, limited, ownedDoc, unconfigured } from '@/lib/profile-access';
import { cleanPlacements, cleanRetro } from '@/lib/profile-access';
import type { Graha } from '@/domain/types';

export const dynamic = 'force-dynamic';

const GENDERS = ['male', 'female', 'other', ''];

function nid(): string {
  const g = globalThis.crypto?.randomUUID?.();
  return g ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Add one native (person) to a profile. First native becomes Self automatically. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const stop = limited(req);
  if (stop) return stop;
  const unconf = unconfigured();
  if (unconf) return unconf;
  if (badId(params.id)) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  try {
    const r = await ownedDoc(params.id, req);
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
    const body = (await req.json()) as Record<string, unknown>;
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!Number.isFinite(body.ascendant)) {
      return NextResponse.json({ error: 'ascendant is required' }, { status: 400 });
    }
    const placements = cleanPlacements(body.placements);
    if (!placements) {
      return NextResponse.json({ error: '9 finite placements are required' }, { status: 400 });
    }
    const gender = typeof body.gender === 'string' && GENDERS.includes(body.gender) ? body.gender : '';
    const natives = (r.doc.natives as unknown[]) ?? [];
    const native = {
      nid: nid(),
      name: (body.name as string).trim().slice(0, 80),
      gender,
      isSelf: natives.length === 0 ? true : body.isSelf === true,
      birthISO: typeof body.birthISO === 'string' ? body.birthISO : null,
      placeLabel: typeof body.placeLabel === 'string' ? body.placeLabel : null,
      lat: Number.isFinite(body.lat) ? (body.lat as number) : null,
      lon: Number.isFinite(body.lon) ? (body.lon as number) : null,
      ascendant: body.ascendant as number,
      placements,
      retro: cleanRetro(body.retro),
      lang: body.lang === 'hi' || body.lang === 'hinglish' ? body.lang : 'en',
    };
    if (native.isSelf) {
      for (const n of natives as { isSelf: boolean }[]) n.isSelf = false;
    }
    natives.push(native);
    r.doc.natives = natives as never;
    await r.doc.save();
    return NextResponse.json({ nid: native.nid }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'db error' }, { status: 500 });
  }
}
