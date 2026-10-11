// Shared MCP server: kundali context tools for any MCP client
// (Claude Connectors/Desktop/CLI, Gemini CLI/API, ChatGPT dev tools,
// Kimi K2 agents). Stateless: every call carries its own identity — no
// sessions, so it scales on serverless (Vercel free tier friendly).
//
// Anti-mixing rule (enforced by shape, not just words): native tools always
// resolve to EXACTLY ONE native. list_* returns names only; full context
// comes only from get_native / get_my_* for a single chosen native.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildAllVargas } from '@/domain/chart-engine';
import { aspectEngine } from '@/domain/aspect-engine';
import { yogaEngine } from '@/domain/yoga-engine';
import { VARGAS } from '@/domain/varga-engine';
import type { ChartState, Graha, Varga } from '@/domain/types';
import { connectMongo, isMongoConfigured } from '@/lib/mongo';
import { ProfileModel, serializeProfile, type ClientNative } from '@/lib/models/Profile';

const RASHI_EN = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

const VARGA_NAMES: Record<Varga, string> = {
  D1: 'Rashi (birth chart)',
  D4: 'Chaturthamsha (property & fortune)',
  D6: 'Shashtamsha (health & obstacles)',
  D7: 'Saptamsha (children)',
  D9: 'Navamsha (marriage & inner strength)',
  D10: 'Dashamsha (career)',
  D60: 'Shashtiamsha (past karma)',
};

const Placements = z.object({
  Sun: z.number(), Moon: z.number(), Mars: z.number(), Mercury: z.number(),
  Jupiter: z.number(), Venus: z.number(), Saturn: z.number(), Rahu: z.number(), Ketu: z.number(),
});

const GRAHAS: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function text(t: string): { content: { type: 'text'; text: string }[] } {
  return { content: [{ type: 'text' as const, text: t }] };
}

const LOCKED =
  'This profile link is locked. Ask the user to open Kundali Learn → Settings → Profiles → Connect on the right profile and share the fresh link (it carries the access secret).';

function nativeHeader(profileName: string, n: ClientNative): string {
  const who = `${n.name}${n.gender ? ` (${n.gender})` : ''}${n.isSelf ? ' [self]' : ''}`;
  return `Native: ${who} of profile "${profileName}"${n.birthISO ? `, born ${n.birthISO}` : ''}${n.placeLabel ? ` at ${n.placeLabel}` : ''}.`;
}

/** Compact full-chart context for ONE native: every varga, dignity-first. */
export function nativeContext(profileName: string, n: ClientNative): string {
  const chart: ChartState = { ascendant: n.ascendant, placements: n.placements };
  const all = buildAllVargas(chart, 'Janma');
  const L: string[] = [];
  L.push(nativeHeader(profileName, n));
  L.push('KUNDALI (Vedic, traditional method, houses counted from the rising sign). Use only these facts; never invent placements; never mix with any other native.');
  for (const v of VARGAS) {
    const b = all[v];
    L.push(`[${v} · ${VARGA_NAMES[v]}] Rising: ${RASHI_EN[b.lagnaRashi]}.`);
    for (const g of GRAHAS) {
      const p = b.planets[g];
      L.push(`- ${g}: ${RASHI_EN[p.vargaRashi[v]]} (house ${p.bhava}), ${p.dignity}${p.isRetrograde ? ', retrograde' : ''}.`);
    }
  }
  const yogas = yogaEngine(all.D1, aspectEngine(all.D1));
  if (yogas.length) {
    L.push('Special combinations:');
    for (const y of yogas.slice(0, 12)) L.push(`- ${y.name} (${y.favourable ? 'helpful' : 'testing'}, ${y.strength}).`);
  }
  L.push('Style: warm teacher, simple words, no fear or fixed fate, no medical/legal/money orders, evidence-linked claims only.');
  return L.join('\n');
}

function vargaTable(profileName: string, n: ClientNative, varga: Varga, chandra: boolean): string {
  const chart: ChartState = { ascendant: n.ascendant, placements: n.placements };
  const all = buildAllVargas(chart, chandra ? 'Chandra' : 'Janma');
  const b = all[varga];
  const L = [nativeHeader(profileName, n), `[${varga} · ${VARGA_NAMES[varga]}${chandra ? ', Moon-rising' : ''}] Rising: ${RASHI_EN[b.lagnaRashi]}.`];
  for (const g of GRAHAS) {
    const p = b.planets[g];
    L.push(`- ${g}: ${RASHI_EN[p.vargaRashi[varga]]} (house ${p.bhava}), ${p.dignity}${p.isRetrograde ? ', retrograde' : ''}, ${Math.floor(varga === 'D1' ? p.degreeInRashi : p.vargaDegree)}°.`);
  }
  return L.join('\n');
}

async function loadNatives(profileId: string): Promise<{ name: string; natives: ClientNative[] } | null> {
  if (!isMongoConfigured()) return null;
  if (!/^[0-9a-fA-F]{24}$/.test(profileId)) return null;
  await connectMongo();
  const doc = await ProfileModel.findById(profileId).lean();
  if (!doc) return null;
  const s = serializeProfile(doc as never);
  return { name: s.name, natives: s.natives };
}

function findNative(natives: ClientNative[], ref: string): ClientNative | 'ambiguous' | null {
  const exact = natives.find((n) => n.nid === ref);
  if (exact) return exact;
  const matches = natives.filter((n) => n.name.toLowerCase() === ref.toLowerCase());
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return 'ambiguous';
  return null;
}

function pastedNative(ascendant: number, placements: Record<Graha, number>): ClientNative {
  return {
    nid: 'pasted', name: 'pasted chart', gender: '', isSelf: false, birthISO: null,
    placeLabel: null, lat: null, lon: null, ascendant, placements,
    retro: null, lang: 'en',
  };
}

async function bumpUses(profileId: string): Promise<void> {  try {
    await ProfileModel.updateOne(
      { _id: profileId },
      { $inc: { uses: 1 }, $set: { lastUsedAt: new Date() } },
    ).exec();
  } catch {
    /* usage stats must never break a reading */
  }
}

export function createKundaliServer(opts?: { profileId?: string; secretValid?: boolean }): McpServer {
  const server = new McpServer({ name: 'kundali-learn', version: '1.0.0' });
  const locked = (pid: string): boolean => !!pid && opts?.secretValid !== true;

  // ---- Per-profile tools: identity rides in the URL, zero mixing ----
  if (opts?.profileId) {
    const pid = opts.profileId;
    server.tool(
      'list_natives',
      'List the people (natives) saved under this profile: name + id only, no chart data. If the user has not said WHO to read, call this and ask them to pick exactly one.',
      {},
      async () => {
        if (locked(pid)) return text(LOCKED);
        const loaded = await loadNatives(pid);
        if (!loaded || !loaded.natives.length) return text('No natives saved under this profile yet.');
        await bumpUses(pid);
        return text(
          [`People in "${loaded.name}" — reply with these options and let the user pick ONE:`]
            .concat(loaded.natives.map((n) => `- ${n.name}${n.gender ? ` (${n.gender})` : ''}${n.isSelf ? ' [self]' : ''} (id: ${n.nid})`))
            .join('\n'),
        );
      },
    );
    server.tool(
      'get_native',
      'Full kundali context of ONE native (every varga, yogas, houses, dignities). Pass the nid from list_natives, or the exact name. Answer about this native ONLY.',
      { native: z.string().describe('nid from list_natives, or the exact person name') },
      async ({ native }) => {
        if (locked(pid)) return text(LOCKED);
        const loaded = await loadNatives(pid);
        if (!loaded) return text('Profile not found or database unavailable.');
        const found = findNative(loaded.natives, native);
        if (found === 'ambiguous') return text(`Several natives share that name — call list_natives and ask the user to pick one id.`);
        if (!found) return text('No such native in this profile. Call list_natives to see who is saved.');
        await bumpUses(pid);
        return text(nativeContext(loaded.name, found));
      },
    );
    server.tool(
      'get_native_varga',
      'One divisional chart of ONE native. No mixing: exactly one native per call.',
      {
        native: z.string().describe('nid from list_natives, or the exact person name'),
        varga: z.enum(['D1', 'D4', 'D6', 'D7', 'D9', 'D10', 'D60']),
        chandra: z.boolean().optional().describe('Count houses from the Moon instead of the ascendant'),
      },
      async ({ native, varga, chandra }) => {
        if (locked(pid)) return text(LOCKED);
        const loaded = await loadNatives(pid);
        if (!loaded) return text('Profile not found or database unavailable.');
        const found = findNative(loaded.natives, native);
        if (found === 'ambiguous') return text(`Several natives share that name — call list_natives and ask the user to pick one id.`);
        if (!found) return text('No such native in this profile. Call list_natives to see who is saved.');
        await bumpUses(pid);
        return text(vargaTable(loaded.name, found, varga, chandra ?? false));
      },
    );
  }

  // ---- Open tools: explicit user-supplied charts (never anyone's stored data) ----
  server.tool(
    'get_kundali',
    'Full kundali context from an explicit chart (ascendant + 9 longitudes the user pasted). Use when no saved profile exists.',
    { ascendant: z.number(), placements: Placements },
    async ({ ascendant, placements }) => text(nativeContext('pasted chart', pastedNative(ascendant, placements))),
  );

  server.tool(
    'get_varga',
    'One divisional chart table from an explicit chart the user pasted (never stored data).',
    {
      ascendant: z.number(),
      placements: Placements,
      varga: z.enum(['D1', 'D4', 'D6', 'D7', 'D9', 'D10', 'D60']),
      chandra: z.boolean().optional().describe('Count houses from the Moon instead of the ascendant'),
    },
    async ({ ascendant, placements, varga, chandra }) => text(vargaTable('pasted chart', pastedNative(ascendant, placements), varga, chandra ?? false)),
  );

  // ---- Account tools: owner-scoped discovery (uuid capability, names only) ----
  // Full stored readings always require the profile's personal secret link.
  server.tool(
    'list_profiles',
    'List the saved profiles of ONE account (names + native counts only, never chart data). One account per call; never merge accounts.',
    { accountId: z.string().describe('The account id from the Kundali Learn app (Settings → Connection & Data)') },
    async ({ accountId }) => {
      if (!isMongoConfigured()) return text('No profile database configured.');
      if (!/^[0-9a-fA-F-]{8,64}$/.test(accountId)) return text('That account id looks invalid.');
      await connectMongo();
      const docs = await ProfileModel.find({ ownerId: accountId }).sort({ updatedAt: -1 }).limit(20).lean();
      if (!docs.length) return text('No profiles for this account yet.');
      return text(docs.map((d) => {
        const s = serializeProfile(d as never);
        return `- ${s.name} (${s.natives.length} natives, id: ${s.id})`;
      }).join('\n'));
    },
  );

  server.tool(
    'get_profile',
    'List the natives (people) inside ONE profile: names only. Then load exactly one native per question via its personal secret link — never blend people.',
    {
      profileId: z.string(),
      accountId: z.string().describe('Must own this profile'),
    },
    async ({ profileId, accountId }) => {
      if (!isMongoConfigured()) return text('No profile database configured.');
      if (!/^[0-9a-fA-F]{24}$/.test(profileId)) return text('That profile id looks invalid.');
      await connectMongo();
      const doc = await ProfileModel.findById(profileId).lean();
      if (!doc) return text('Profile not found.');
      const owner = (doc.ownerId as string | null | undefined) ?? null;
      if (!owner || owner !== accountId) {
        return text('Private profile. Ask the user for its personal MCP link (Settings → Profiles → Connect), which carries access.');
      }
      const s = serializeProfile(doc as never);
      if (!s.natives.length) return text(`Profile "${s.name}" has no natives saved yet.`);
      return text(
        [`Natives in "${s.name}" — pick exactly ONE per question, then open its personal link for the full reading:`]
          .concat(s.natives.map((n) => `- ${n.name}${n.gender ? ` (${n.gender})` : ''}${n.isSelf ? ' [self]' : ''} (id: ${n.nid})`))
          .join('\n'),
      );
    },
  );

  return server;
}
