'use client';

// Native profiles: each PROFILE is a container (one family/account) holding
// many NATIVES (people). Cloud (Mongo, owner-scoped) when configured,
// otherwise local (localStorage). MCP connects per profile via its API secret.
import { create } from 'zustand';
import type { Graha } from '@/domain/types';
import { STRINGS, type Lang } from '@/i18n/strings';
import { toastError } from '@/components/ui/Toast';
import { useChartStore } from './chart-store';

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
  lang: Lang;
}

export interface ClientProfile {
  id: string;
  name: string;
  hasSecret: boolean;
  uses: number;
  natives: ClientNative[];
}

interface ProfileStore {
  accountId: string;
  profiles: ClientProfile[];
  activeProfileId: string | null;
  activeNativeId: string | null;
  source: 'cloud' | 'local' | 'unknown';
  loaded: boolean;
  refresh: () => Promise<void>;
  createProfile: (name: string) => Promise<ClientProfile | null>;
  deleteProfile: (id: string) => Promise<void>;
  saveNative: (profileId: string, name: string, gender: string) => Promise<ClientNative | null>;
  loadNative: (profileId: string, nid: string) => void;
  markSelfNative: (profileId: string, nid: string) => Promise<void>;
  deleteNative: (profileId: string, nid: string) => Promise<void>;
  /** Full AI connect link (creates the profile secret on first use). Null when offline. */
  ensureConnectUrl: (profileId: string) => Promise<string | null>;
  revokeSecret: (profileId: string) => Promise<void>;
  /** Rebind to a different account (login/logout) and reload its profiles. */
  setAccountId: (id: string) => void;
  /** Move this browser's anonymous device charts into the logged-in account. */
  adoptDevice: () => Promise<number>;
}

const LS_KEY = 'kl-profiles';
const ACCT_KEY = 'kl-account';
const SEC_KEY = 'kl-secrets';

function readLocal(): ClientProfile[] {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as ClientProfile[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocal(profiles: ClientProfile[]): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(profiles));
  } catch {
    /* storage full/blocked: cloud remains source of truth */
  }
}

function readSecrets(): Record<string, string> {
  try {
    return (JSON.parse(window.localStorage.getItem(SEC_KEY) ?? '{}') ?? {}) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeSecrets(m: Record<string, string>): void {
  try {
    window.localStorage.setItem(SEC_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export function accountId(): string {
  try {
    let id = window.localStorage.getItem(ACCT_KEY);
    if (!id) {
      id = (window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`);
      window.localStorage.setItem(ACCT_KEY, id);
    }
    return id;
  } catch {
    return 'local-only';
  }
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function currentChart() {
  const st = useChartStore.getState();
  const chart = st.mode === 'explore' && st.draft ? st.draft : st.birth;
  return chart ? { st, chart } : null;
}

export const useProfileStore = create<ProfileStore>()((set, get) => ({
  accountId: typeof window === 'undefined' ? '' : accountId(),
  profiles: [],
  activeProfileId: null,
  activeNativeId: null,
  source: 'unknown',
  loaded: false,

  refresh: async () => {
    const acct = get().accountId || accountId();
    try {
      const res = await fetch(`/api/profiles?owner=${encodeURIComponent(acct)}`, {
        cache: 'no-store',
        headers: { 'x-account-id': acct },
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      const data = (await res.json()) as { profiles: ClientProfile[] };
      set({ profiles: data.profiles, source: 'cloud', loaded: true, accountId: acct });
    } catch {
      set({ profiles: readLocal(), source: 'local', loaded: true, accountId: acct });
    }
  },

  createProfile: async (name) => {
    const acct = get().accountId || accountId();
    const clean = name.trim().slice(0, 80) || 'My Family';
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-account-id': acct },
        body: JSON.stringify({ ownerId: acct, name: clean }),
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      const data = (await res.json()) as { profile: ClientProfile };
      set({ profiles: [data.profile, ...get().profiles], activeProfileId: data.profile.id, source: 'cloud' });
      return data.profile;
    } catch {
      const profile: ClientProfile = { id: uid(), name: clean, hasSecret: false, uses: 0, natives: [] };
      const profiles = [profile, ...get().profiles];
      writeLocal(profiles);
      set({ profiles, activeProfileId: profile.id, source: 'local' });
      return profile;
    }
  },

  deleteProfile: async (id) => {
    const { source, profiles, activeProfileId } = get();
    const acct = get().accountId;
    if (source === 'cloud') {
      try {
        await fetch(`/api/profiles/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'x-account-id': acct },
        });
      } catch {
        /* fall through to local removal */
      }
    }
    const next = profiles.filter((x) => x.id !== id);
    writeLocal(next);
    set({
      profiles: next,
      activeProfileId: activeProfileId === id ? null : activeProfileId,
      activeNativeId: activeProfileId === id ? null : get().activeNativeId,
    });
    if (source === 'cloud') {
      await get().refresh().catch(() => undefined);
    }
  },

  saveNative: async (profileId, name, gender) => {
    const cur = currentChart();
    if (!cur) {
      toastError(STRINGS[useChartStore.getState().lang].toastNoChart);
      return null;
    }
    const { st, chart } = cur;
    const { source, profiles } = get();
    const acct = get().accountId;
    const clean = name.trim().slice(0, 80) || 'Unnamed';
    const payload = {
      name: clean,
      gender,
      birthISO: st.birthISO,
      placeLabel: st.birthPlace?.label ?? null,
      lat: st.birthPlace?.lat ?? null,
      lon: st.birthPlace?.lon ?? null,
      ascendant: chart.ascendant,
      placements: chart.placements,
      retro: st.retro,
      lang: st.lang,
    };
    if (source === 'cloud') {
      try {
        const res = await fetch(`/api/profiles/${encodeURIComponent(profileId)}/natives`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-account-id': acct },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`http ${res.status}`);
        const data = (await res.json()) as { nid: string };
        await get().refresh();
        const np = { ...payload, nid: data.nid, isSelf: false } as ClientNative;
        set({ activeProfileId: profileId, activeNativeId: data.nid });
        return np;
      } catch {
        return null;
      }
    }
    const next = profiles.map((p) => {
      if (p.id !== profileId) return p;
      const native: ClientNative = {
        ...payload, nid: uid(), isSelf: p.natives.length === 0, lang: st.lang,
      };
      return { ...p, natives: [...p.natives, native] };
    });
    writeLocal(next);
    const saved = next.find((p) => p.id === profileId)?.natives.slice(-1)[0] ?? null;
    set({ profiles: next, activeProfileId: profileId, activeNativeId: saved?.nid ?? null });
    return saved;
  },

  loadNative: (profileId, nid) => {
    const p = get().profiles.find((x) => x.id === profileId);
    const n = p?.natives.find((x) => x.nid === nid);
    if (!n) return;
    const st = useChartStore.getState();
    st.loadBirth({ ascendant: n.ascendant, placements: { ...n.placements } });
    st.setRetro(n.retro);
    st.setBirthISO(n.birthISO);
    st.setBirthPlace(n.placeLabel && n.lat !== null && n.lon !== null
      ? { label: n.placeLabel, lat: n.lat, lon: n.lon }
      : null);
    st.setNativeName(n.name);
    st.autoFill();
    set({ activeProfileId: profileId, activeNativeId: nid });
  },

  markSelfNative: async (profileId, nid) => {
    const { source } = get();
    const acct = get().accountId;
    if (source === 'cloud') {
      try {
        await fetch(`/api/profiles/${encodeURIComponent(profileId)}/natives/${encodeURIComponent(nid)}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json', 'x-account-id': acct },
          body: JSON.stringify({ isSelf: true }),
        });
        await get().refresh();
        return;
      } catch {
        /* fall through */
      }
    }
    const next = get().profiles.map((p) => {
      if (p.id !== profileId) return p;
      return { ...p, natives: p.natives.map((n) => ({ ...n, isSelf: n.nid === nid })) };
    });
    writeLocal(next);
    set({ profiles: next });
  },

  deleteNative: async (profileId, nid) => {
    const { source, activeNativeId } = get();
    const acct = get().accountId;
    if (source === 'cloud') {
      try {
        await fetch(`/api/profiles/${encodeURIComponent(profileId)}/natives/${encodeURIComponent(nid)}`, {
          method: 'DELETE',
          headers: { 'x-account-id': acct },
        });
      } catch {
        /* fall through */
      }
    }
    const next = get().profiles.map((p) => {
      if (p.id !== profileId) return p;
      return { ...p, natives: p.natives.filter((n) => n.nid !== nid) };
    });
    writeLocal(next);
    set({ profiles: next, activeNativeId: activeNativeId === nid ? null : activeNativeId });
    if (source === 'cloud') {
      await get().refresh().catch(() => undefined);
    }
  },

  ensureConnectUrl: async (profileId) => {
    const { source } = get();
    if (source !== 'cloud') return null;
    const acct = get().accountId;
    const secrets = readSecrets();
    if (secrets[profileId]) {
      return `${window.location.origin}/api/mcp/${profileId}?access_token=${secrets[profileId]}`;
    }
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(profileId)}/secret`, {
        method: 'POST',
        headers: { 'x-account-id': acct },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { secret: string };
      secrets[profileId] = data.secret;
      writeSecrets(secrets);
      await get().refresh().catch(() => undefined);
      return `${window.location.origin}/api/mcp/${profileId}?access_token=${data.secret}`;
    } catch {
      return null;
    }
  },

  revokeSecret: async (profileId) => {
    const acct = get().accountId;
    try {
      await fetch(`/api/profiles/${encodeURIComponent(profileId)}/secret`, {
        method: 'DELETE',
        headers: { 'x-account-id': acct },
      });
    } catch {
      /* ignore */
    }
    const secrets = readSecrets();
    delete secrets[profileId];
    writeSecrets(secrets);
    await get().refresh().catch(() => undefined);
  },

  setAccountId: (id) => {
    set({ accountId: id, activeProfileId: null, activeNativeId: null, loaded: false });
    void get().refresh();
  },

  adoptDevice: async () => {
    const anon = (() => {
      try {
        return window.localStorage.getItem(ACCT_KEY);
      } catch {
        return null;
      }
    })();
    const mine = get().accountId;
    if (!anon || !mine || anon === mine) return 0;
    try {
      const res = await fetch('/api/profiles/adopt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fromOwnerId: anon }),
      });
      if (!res.ok) return 0;
      const data = (await res.json()) as { adopted?: number };
      await get().refresh().catch(() => undefined);
      return data.adopted ?? 0;
    } catch {
      return 0;
    }
  },
}));
