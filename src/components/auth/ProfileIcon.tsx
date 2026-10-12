'use client';

// Topbar identity: avatar button opening one menu with everything personal —
// who is signed in, the active native's birth details, profile switching,
// quick native loading, and entries to login / manage.
import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { useProfileStore } from '@/state/profile-store';
import { Dropdown } from '@/components/ui/Dropdown';

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <circle cx={12} cy={8} r={3.6} fill="none" stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

function splitBirth(iso: string | null): { date: string; time: string } {
  if (!iso || !iso.includes('T')) return { date: iso ?? '—', time: '—' };
  const [d, t] = iso.split('T');
  return { date: d, time: t.slice(0, 5) };
}

export function ProfileIcon({ onManage, onLogin }: { onManage: () => void; onLogin: () => void }) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const birthISO = useChartStore((s) => s.birthISO);
  const birthPlace = useChartStore((s) => s.birthPlace);
  const nativeName = useChartStore((s) => s.nativeName);
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;
  const loadNative = useProfileStore((s) => s.loadNative);
  const setAccountId = useProfileStore((s) => s.setAccountId);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  const email = session?.user?.email ?? null;
  const initial = (nativeName || email || '?').trim().slice(0, 1).toUpperCase();
  const born = splitBirth(birthISO);

  const logout = async (): Promise<void> => {
    await signOut({ redirect: false });
    try {
      const anon = window.localStorage.getItem('kl-account');
      if (anon) setAccountId(anon);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div className="lang-wrap" ref={ref}>
      <button
        className="icon-btn gear-btn profile-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={S.setProfiles}
        title={nativeName || S.setProfiles}
      >
        {nativeName || email ? <span className="profile-initial" aria-hidden>{initial}</span> : <PersonIcon />}
      </button>
      {open && (
        <div className="lang-menu profile-menu" role="menu">
          {email ? (
            <div className="profile-who">
              <span className="profile-initial big" aria-hidden>{email.slice(0, 1).toUpperCase()}</span>
              <span className="profile-mail">{email}</span>
            </div>
          ) : (
            <button
              className="btn active profile-login"
              onClick={() => {
                setOpen(false);
                onLogin();
              }}
            >
              {S.authLogin}
            </button>
          )}
          <div className="profile-detail">
            <div className="profile-detail-name">{nativeName || '—'}</div>
            <div className="profile-detail-grid">
              <span>{S.authDob}</span>
              <span>{born.date}</span>
              <span>{S.authTob}</span>
              <span>{born.time}</span>
              <span>{S.authPob}</span>
              <span>{birthPlace?.label ?? '—'}</span>
            </div>
          </div>
          {profiles.length > 0 && (
            <div className="profile-switch">
              <Dropdown
                value={activeProfile?.id ?? ''}
                options={profiles.map((p) => ({ value: p.id, label: `${p.name} (${p.natives.length})` }))}
                onPick={(id) => {
                  const first = profiles.find((x) => x.id === id)?.natives[0];
                  if (first) loadNative(id, first.nid);
                }}
                ariaLabel={S.setProfiles}
              />
            </div>
          )}
          {activeProfile && activeProfile.natives.length > 0 && (
            <div className="profile-natives" role="group" aria-label={activeProfile.name}>
              {activeProfile.natives.slice(0, 6).map((n) => (
                <button key={n.nid} className="lang-item" role="menuitem" onClick={() => { loadNative(activeProfile.id, n.nid); setOpen(false); }}>
                  {n.name}
                  {n.isSelf && <span aria-hidden> ✓</span>}
                </button>
              ))}
            </div>
          )}
          <div className="profile-foot">
            <button
              className="link-btn sm"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
            >
              {S.setTitle}
            </button>
            {email && (
              <button className="link-btn sm" onClick={logout}>
                {S.authLogout}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
