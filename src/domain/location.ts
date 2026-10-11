// Location resolution: offline gazetteers first, pincode API, then online.
// Pure ranking/matching is unit-tested; only the provider functions touch
// the network (UI layer concern, never the deterministic chart engines).
// Coordinates always come from data — the user never types lat/long.

export type PlaceSource = 'local' | 'pincode' | 'online';
export type PlacePrecision = 'exact' | 'district' | 'approx';

export interface PlaceResult {
  label: string;
  sub: string;
  lat: number;
  lon: number;
  source: PlaceSource;
  precision: PlacePrecision;
}

export interface GazetteerRow {
  n: string;
  a: string;
  la: number;
  lo: number;
  p: number;
  s: string;
  d: string;
  k: 'place' | 'district' | 'state';
  c?: string;
}

export function classifyQuery(q: string): 'pincode' | 'text' | 'empty' {
  const t = q.trim();
  if (t === '') return 'empty';
  return /^[1-9]\d{5}$/.test(t) ? 'pincode' : 'text';
}

/** Lowercase, trim, collapse spaces, drop punctuation. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rowNames(r: GazetteerRow): string[] {
  return [normalize(r.n), normalize(r.a)].filter((x, i, arr) => x !== '' && arr.indexOf(x) === i);
}

function matchScore(qn: string, row: GazetteerRow): number {
  let best = 0;
  for (const name of rowNames(row)) {
    if (name === qn) best = Math.max(best, 100);
    else if (name.startsWith(qn)) best = Math.max(best, 70);
    else if (qn.length >= 3 && name.split(' ').some((w) => w.startsWith(qn))) best = Math.max(best, 55);
    else if (name.includes(qn)) best = Math.max(best, 40);
  }
  if (best === 0) return 0;
  // Break ties toward bigger, more official places.
  const popBoost = Math.min(12, Math.log10(row.p + 10) * 2);
  const kindBoost = row.k === 'district' ? 4 : row.k === 'state' ? 6 : 0;
  return best + popBoost + kindBoost;
}

export function rankLocal(query: string, rows: GazetteerRow[], limit = 8): GazetteerRow[] {
  const qn = normalize(query);
  if (qn.length < 2) return [];
  return rows
    .map((r) => ({ r, s: matchScore(qn, r) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.r.p - a.r.p)
    .slice(0, limit)
    .map((x) => x.r);
}

export function buildLabel(row: GazetteerRow): { label: string; sub: string } {
  const kind = row.k === 'district' ? ` (${row.k})` : row.k === 'state' ? ` (${row.k})` : '';
  const label = `${row.n}${kind}`;
  const parts = [row.d && row.d !== row.n ? row.d : '', row.s, row.c ?? ''].filter(Boolean);
  return { label, sub: parts.join(', ') };
}

/** Best-effort district match for pincode results ("Central Delhi" etc). */
export function findDistrict(districtName: string, rows: GazetteerRow[]): GazetteerRow | null {
  const qn = normalize(districtName).replace(/\b(central|south|north|east|west|rural|urban|district)\b/g, '').trim();
  const districts = rows.filter((r) => r.k === 'district');
  let best: GazetteerRow | null = null;
  let bestScore = 0;
  for (const d of districts) {
    const dn = normalize(d.n);
    let s = 0;
    if (dn === qn || dn === normalize(districtName)) s = 100;
    else if (qn !== '' && (dn.includes(qn) || qn.includes(dn))) s = 60;
    else {
      const qt = new Set(qn.split(' ').filter((w) => w.length > 2));
      const dt = new Set(dn.split(' '));
      let overlap = 0;
      for (const w of qt) if (dt.has(w)) overlap += 1;
      if (overlap > 0 && qt.size > 0) s = (overlap / qt.size) * 50;
    }
    if (s > bestScore) {
      bestScore = s;
      best = d;
    }
  }
  return bestScore >= 40 ? best : null;
}

// ---------- Providers (network; UI layer only) ----------

let indiaCache: GazetteerRow[] | null = null;
let worldCache: GazetteerRow[] | null = null;

export async function loadIndia(): Promise<GazetteerRow[]> {
  if (!indiaCache) {
    const mod = (await import('../data/india-places.json')) as unknown as { default: GazetteerRow[] };
    indiaCache = mod.default;
  }
  return indiaCache;
}

export async function loadWorld(): Promise<GazetteerRow[]> {
  if (!worldCache) {
    const mod = (await import('../data/world-cities.json')) as unknown as { default: GazetteerRow[] };
    worldCache = mod.default;
  }
  return worldCache;
}

export function toResult(row: GazetteerRow, source: PlaceSource): PlaceResult {
  const { label, sub } = buildLabel(row);
  return {
    label, sub, lat: row.la, lon: row.lo, source,
    precision: row.k === 'place' ? 'exact' : row.k === 'district' ? 'district' : 'approx',
  };
}

interface PinOffice {
  Name: string;
  District: string;
  State: string;
  Block?: string;
}

/** 6-digit PIN -> district centroid via the free postal directory (no key). */
export async function searchPincode(pin: string): Promise<PlaceResult[]> {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
  if (!res.ok) throw new Error(`pincode lookup failed (${res.status})`);
  const data = (await res.json()) as { Status: string; PostOffice: PinOffice[] | null }[];
  const offices = data?.[0]?.PostOffice ?? [];
  if (offices.length === 0) return [];
  const rows = await loadIndia();
  const out: PlaceResult[] = [];
  const seen = new Set<string>();
  for (const o of offices.slice(0, 6)) {
    const district = findDistrict(o.District, rows);
    const key = district ? `${district.la},${district.lo}` : o.District;
    if (seen.has(key)) continue;
    seen.add(key);
    if (district) {
      out.push({
        label: `PIN ${pin} · ${o.Name}`,
        sub: `${o.District}, ${o.State} (area approx)`,
        lat: district.la, lon: district.lo,
        source: 'pincode', precision: 'district',
      });
    } else {
      out.push({
        label: `PIN ${pin} · ${o.Name}`,
        sub: `${o.District}, ${o.State}`,
        lat: 0, lon: 0,
        source: 'pincode', precision: 'approx',
      });
    }
  }
  return out;
}

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance?: number;
}

/** Villages and the wider world via OpenStreetMap Nominatim (no key). */
export async function searchOnline(query: string, limit = 5): Promise<PlaceResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&addressdetails=0&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`place search failed (${res.status})`);
  const data = (await res.json()) as NominatimHit[];
  return data.map((h) => {
    const parts = h.display_name.split(', ');
    return {
      label: parts.slice(0, 2).join(', '),
      sub: `${parts.slice(2, 4).join(', ')} · OpenStreetMap`,
      lat: Number(h.lat), lon: Number(h.lon),
      source: 'online' as PlaceSource, precision: 'approx' as PlacePrecision,
    };
  });
}

/** Full search: local gazetteers first, online fallback for the long tail. */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const kind = classifyQuery(query);
  if (kind === 'empty') return [];
  if (kind === 'pincode') {
    try {
      const pins = await searchPincode(query.trim());
      return pins.filter((p) => p.lat !== 0 || p.lon !== 0);
    } catch {
      return [];
    }
  }
  const [india, world] = await Promise.all([loadIndia(), loadWorld()]);
  const local = [...rankLocal(query, india, 6), ...rankLocal(query, world, 3)]
    .map((r) => toResult(r, 'local'))
    .slice(0, 8);
  if (local.length >= 3) return local;
  try {
    const online = await searchOnline(query);
    const seen = new Set(local.map((r) => `${r.label}|${r.sub}`));
    return [...local, ...online.filter((r) => !seen.has(`${r.label}|${r.sub}`))].slice(0, 8);
  } catch {
    return local;
  }
}
