// Shared guards for the profile/natives REST API: rate limiting, id shape,
// and owner checks. One place, every route uses it.
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { connectMongo, isMongoConfigured } from '@/lib/mongo';
import { ProfileModel, type ProfileDoc } from '@/lib/models/Profile';
import { callerFromRequest } from '@/lib/auth';
import { authOptions } from '@/lib/auth-options';
import { checkRateLimit, clientIp } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import type { Graha } from '@/domain/types';

const GRAHAS: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export function limited(req: Request): NextResponse | null {
  const r = checkRateLimit(`api:ip:${clientIp(req)}`, 240, 60_000);
  return r.ok ? null : NextResponse.json({ error: 'rate limit — slow down' }, { status: 429 });
}

export function badId(id: string): boolean {
  return !mongoose.Types.ObjectId.isValid(id);
}

export function unconfigured(): NextResponse | null {
  return isMongoConfigured()
    ? null
    : NextResponse.json({ error: 'unconfigured' }, { status: 503 });
}

/** Owner for this request: logged-in user id wins, else the anonymous browser id. */
export async function effectiveOwnerId(req: Request): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    const uid = (session?.user as { id?: string } | undefined)?.id;
    if (uid) return uid;
  } catch {
    /* sessions unavailable (no secret configured): stay anonymous */
  }
  return callerFromRequest(req).accountId;
}

/** The doc, only when the caller owns its account. Legacy ownerless docs are read-only. */
export async function ownedDoc(
  id: string,
  req: Request,
): Promise<{ doc: mongoose.HydratedDocument<ProfileDoc> } | { error: string; status: number }> {
  await connectMongo();
  const doc = await ProfileModel.findById(id);
  if (!doc) return { error: 'not found', status: 404 };
  const owner = (doc.ownerId as string | null | undefined) ?? null;
  if (!owner) return { error: 'legacy profiles are read-only here', status: 403 };
  const mine = await effectiveOwnerId(req);
  if (mine !== owner) return { error: 'forbidden', status: 403 };
  return { doc: doc as mongoose.HydratedDocument<ProfileDoc> };
}

/**
 * Rebuild placements from scratch: exactly the 9 grahas, finite numbers.
 * Never stores caller-shaped objects (kills __proto__/extra-key injection
 * into the Mixed field).
 */
export function cleanPlacements(p: unknown): Record<Graha, number> | null {
  if (typeof p !== 'object' || p === null) return null;
  const src = p as Record<string, unknown>;
  const out = {} as Record<Graha, number>;
  for (const g of GRAHAS) {
    const v = src[g];
    if (!Number.isFinite(v)) return null;
    out[g] = v as number;
  }
  return out;
}

/** Allowlist retrograde flags: known grahas -> booleans only. */
export function cleanRetro(r: unknown): Partial<Record<Graha, boolean>> | null {
  if (r === null || r === undefined) return null;
  if (typeof r !== 'object') return null;
  const src = r as Record<string, unknown>;
  const out: Partial<Record<Graha, boolean>> = {};
  for (const g of GRAHAS) {
    if (typeof src[g] === 'boolean') out[g] = src[g] as boolean;
  }
  return out;
}
