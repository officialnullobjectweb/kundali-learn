// Native profile container: ONE profile holds MANY natives (people).
// The MCP connects per profile: the AI lists natives, the user picks one,
// and every answer uses exactly that native's context — never mixed.
// Legacy flat docs (pre-natives) are wrapped on read, never lost.
import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import type { Graha } from '@/domain/types';

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;

const PlacementsSchema = new Schema(
  Object.fromEntries(GRAHAS.map((g) => [g, { type: Number, required: true }])),
  { _id: false },
);

const NativeSchema = new Schema(
  {
    nid: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    isSelf: { type: Boolean, default: false },
    birthISO: { type: String, default: null },
    placeLabel: { type: String, default: null },
    lat: { type: Number, default: null },
    lon: { type: Number, default: null },
    ascendant: { type: Number, required: true },
    placements: { type: PlacementsSchema, required: true },
    retro: { type: Schema.Types.Mixed, default: null },
    lang: { type: String, enum: ['en', 'hinglish', 'hi'], default: 'en' },
  },
  { _id: false },
);

const ProfileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // Anonymous browser account id. Absent = legacy share-link profile.
    ownerId: { type: String, default: null, index: true },
    // SHA-256 of the profile's API secret. Null = MCP locked for this profile.
    apiSecretHash: { type: String, default: null },
    uses: { type: Number, default: 0 },
    lastUsedAt: { type: Date, default: null },
    natives: { type: [NativeSchema], default: [] },
    // Legacy flat fields (pre-natives shape) — read-wrapped, never written.
    birthISO: { type: String, default: null },
    placeLabel: { type: String, default: null },
    lat: { type: Number, default: null },
    lon: { type: Number, default: null },
    ascendant: { type: Number, default: null },
    placements: { type: Schema.Types.Mixed, default: null },
    retro: { type: Schema.Types.Mixed, default: null },
    lang: { type: String, default: 'en' },
    isSelf: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ProfileDoc = InferSchemaType<typeof ProfileSchema> & { _id: mongoose.Types.ObjectId };

export interface ClientNative {
  nid: string;
  name: string;
  gender: string;
  isSelf: boolean;
  birthISO: string | null;
  placeLabel: string | null;
  lat: number | null;
  lon: number | null;
  ascendant: number;
  placements: Record<Graha, number>;
  retro: Partial<Record<Graha, boolean>> | null;
  lang: 'en' | 'hinglish' | 'hi';
}

/** Normalize any stored doc (new or legacy) to the client shape. */
export function serializeProfile(p: ProfileDoc): {
  id: string;
  name: string;
  hasSecret: boolean;
  uses: number;
  natives: ClientNative[];
} {
  const raw = p.natives as unknown as ClientNative[] | undefined;
  let natives: ClientNative[];
  if (Array.isArray(raw) && raw.length > 0) {
    natives = raw.map((n) => ({
      nid: String(n.nid),
      name: n.name,
      gender: n.gender ?? '',
      isSelf: !!n.isSelf,
      birthISO: n.birthISO ?? null,
      placeLabel: n.placeLabel ?? null,
      lat: (n.lat as number | null) ?? null,
      lon: (n.lon as number | null) ?? null,
      ascendant: n.ascendant,
      placements: n.placements as Record<Graha, number>,
      retro: (n.retro as Partial<Record<Graha, boolean>> | null) ?? null,
      lang: (n.lang === 'hi' || n.lang === 'hinglish' ? n.lang : 'en') as ClientNative['lang'],
    }));
  } else {
    // Legacy flat doc -> single native, never lost.
    natives = (p.placements as Record<Graha, number> | null)
      ? [{
        nid: String(p._id),
        name: p.name,
        gender: '',
        isSelf: !!(p.isSelf as boolean | undefined),
        birthISO: (p.birthISO as string | null) ?? null,
        placeLabel: (p.placeLabel as string | null) ?? null,
        lat: (p.lat as number | null) ?? null,
        lon: (p.lon as number | null) ?? null,
        ascendant: (p.ascendant as number | null) ?? 0,
        placements: p.placements as Record<Graha, number>,
        retro: (p.retro as Partial<Record<Graha, boolean>> | null) ?? null,
        lang: (p.lang === 'hi' || p.lang === 'hinglish' ? p.lang : 'en') as ClientNative['lang'],
      }]
      : [];
  }
  return {
    id: String(p._id),
    name: p.name,
    hasSecret: !!(p.apiSecretHash as string | null),
    uses: (p.uses as number | undefined) ?? 0,
    natives,
  };
}

export const ProfileModel =
  (mongoose.models.Profile as mongoose.Model<ProfileDoc> | undefined) ??
  mongoose.model<ProfileDoc>('Profile', ProfileSchema);
