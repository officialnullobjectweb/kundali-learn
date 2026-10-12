'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { useProfileStore } from '@/state/profile-store';
import { toastError } from '@/components/ui/Toast';

export function LoginModal({ onClose, googleOn }: { onClose: () => void; googleOn: boolean }) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const setAccountId = useProfileStore((s) => s.setAccountId);
  const adoptDevice = useProfileStore((s) => s.adoptDevice);

  const submit = async (): Promise<void> => {
    setErr(null);
    setBusy(true);
    try {
      if (mode === 'up') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setErr(data.error ?? S.authFail);
          setBusy(false);
          return;
        }
      }
      const r = await signIn('credentials', { email, password, redirect: false });
      if (r?.error || !r?.ok) {
        setErr(S.authFail);
        setBusy(false);
        return;
      }
      // Rebind local state to the account, then pull its charts in.
      const me = await fetch('/api/auth/me', { cache: 'no-store' })
        .then((x) => x.json() as Promise<{ id?: string }>)
        .catch((): { id?: string } => ({}));
      if (me.id) {
        setAccountId(me.id);
        await adoptDevice();
      }
      onClose();
    } catch {
      setErr(S.authFail);
      toastError(S.authFail);
      setBusy(false);
    }
  };

  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="modal auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label={S.authTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="birth-modal-head">
          <h3>{S.authTitle}</h3>
          <button className="instr-close" onClick={onClose} aria-label={S.bookClose}>
            ×
          </button>
        </div>
        <div className="ai-tabs" role="tablist">
          <button role="tab" aria-selected={mode === 'in'} className={`ai-tab${mode === 'in' ? ' active' : ''}`} onClick={() => setMode('in')}>
            {S.authLogin}
          </button>
          <button role="tab" aria-selected={mode === 'up'} className={`ai-tab${mode === 'up' ? ' active' : ''}`} onClick={() => setMode('up')}>
            {S.authSignup}
          </button>
        </div>
        {mode === 'up' && (
          <input
            className="settings-input auth-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={S.setNamePh}
            aria-label={S.setNamePh}
            autoComplete="name"
            maxLength={80}
          />
        )}
        <input
          className="settings-input auth-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={S.authEmail}
          aria-label={S.authEmail}
          autoComplete="email"
          inputMode="email"
          maxLength={160}
        />
        <input
          className="settings-input auth-field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={S.authPassword}
          aria-label={S.authPassword}
          autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        {err && (
          <p className="birth-err" role="alert">
            {err}
          </p>
        )}
        <button className="btn active auth-go" disabled={busy} onClick={submit}>
          {mode === 'in' ? S.authLogin : S.authSignup}
        </button>
        {googleOn && (
          <button className="btn auth-go" disabled={busy} onClick={() => signIn('google')}>
            {S.authGoogle}
          </button>
        )}
      </div>
    </div>
  );
}
