'use client';

import { useEffect, useState } from 'react';
import { STRINGS } from '@/i18n/strings';
import { toastError } from '@/components/ui/Toast';
import { useChartStore } from '@/state/chart-store';
import { useProfileStore } from '@/state/profile-store';
import { Dropdown } from '@/components/ui/Dropdown';

type Section = 'profiles' | 'ai';

export function SettingsModal({ onClose, onOpenAi }: { onClose: () => void; onOpenAi: () => void }) {
  const lang = useChartStore((s) => s.lang);
  const nativeName = useChartStore((s) => s.nativeName);
  const S = STRINGS[lang];
  const [section, setSection] = useState<Section>('profiles');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [profilePick, setProfilePick] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const activeNativeId = useProfileStore((s) => s.activeNativeId);
  const source = useProfileStore((s) => s.source);
  const refreshProfiles = useProfileStore((s) => s.refresh);
  const createProfile = useProfileStore((s) => s.createProfile);
  const deleteProfile = useProfileStore((s) => s.deleteProfile);
  const saveNative = useProfileStore((s) => s.saveNative);
  const loadNative = useProfileStore((s) => s.loadNative);
  const markSelfNative = useProfileStore((s) => s.markSelfNative);
  const deleteNative = useProfileStore((s) => s.deleteNative);
  const ensureConnectUrl = useProfileStore((s) => s.ensureConnectUrl);
  const revokeSecret = useProfileStore((s) => s.revokeSecret);

  const pick = profilePick || profiles[0]?.id || '';

  useEffect(() => {
    refreshProfiles().catch(() => undefined);
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, refreshProfiles]);

  const flash = (key: string): void => {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1800);
  };

  const copyUrl = async (pid: string): Promise<void> => {
    const url = await ensureConnectUrl(pid);
    if (!url) {
      toastError(S.toastNoLink);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    flash(`connect:${pid}`);
  };

  const save = async (): Promise<void> => {
    let pid = pick;
    if (!pid) {
      const created = await createProfile('My Family');
      if (!created) return;
      pid = created.id;
      setProfilePick(pid);
    }
    const saved = await saveNative(pid, name || nativeName || 'Unnamed', gender);
    if (saved) {
      setName('');
      setGender('');
    }
  };

  const createNew = async (): Promise<void> => {
    const created = await createProfile(newProfileName || 'My Family');
    if (created) {
      setProfilePick(created.id);
      setNewProfileName('');
      setShowNew(false);
    }
  };

  const genderOptions = [
    { value: '', label: S.setGender },
    { value: 'male', label: S.setMale },
    { value: 'female', label: S.setFemale },
    { value: 'other', label: S.setOther },
  ];

  const tabs: { key: Section; label: string }[] = [
    { key: 'profiles', label: S.setProfiles },
    { key: 'ai', label: S.setAi },
  ];

  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="modal settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label={S.setTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="birth-modal-head">
          <h3>{S.setTitle}</h3>
          <button className="instr-close" onClick={onClose} aria-label={S.bookClose}>
            ×
          </button>
        </div>
        <div className="settings-grid">
          <nav className="settings-side" aria-label={S.setTitle}>
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`settings-tab${section === t.key ? ' active' : ''}`}
                aria-pressed={section === t.key}
                onClick={() => setSection(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="settings-main">
            {section === 'profiles' && (
              <div>
                <label className="ai-label">{S.setSaveCurrent}</label>
                <div className="save-row">
                  <input
                    className="settings-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={nativeName || S.setNamePh}
                    aria-label={S.setSaveCurrent}
                    maxLength={80}
                  />
                  <Dropdown value={gender} options={genderOptions} onPick={setGender} ariaLabel={S.setGender} />
                </div>
                <div className="save-row">
                  {profiles.length > 0 && (
                    <Dropdown
                      value={pick}
                      options={profiles.map((p) => ({ value: p.id, label: `${p.name} (${p.natives.length})` }))}
                      onPick={setProfilePick}
                      ariaLabel={S.setProfiles}
                    />
                  )}
                  <button className="btn ghost sm" onClick={() => setShowNew((v) => !v)}>
                    + {S.setNewProfile}
                  </button>
                  <button className="btn active" onClick={save}>
                    {S.setSaveCurrent}
                  </button>
                </div>
                {showNew && (
                  <div className="save-row">
                    <input
                      className="settings-input"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder={S.setProfileName}
                      aria-label={S.setProfileName}
                      maxLength={80}
                    />
                    <button className="btn active" onClick={createNew}>
                      {S.setCreate}
                    </button>
                  </div>
                )}
                <p className="ai-note">
                  {source === 'cloud' ? S.setCloud : S.setLocal} · {profiles.reduce((a, p) => a + p.natives.length, 0)}
                </p>
                <p className="ai-note">{S.setConnectHint}</p>
                {profiles.length === 0 ? (
                  <p className="ai-note">{S.setEmpty}</p>
                ) : (
                  profiles.map((p) => (
                    <div key={p.id} className="profile-card">
                      <div className="profile-head">
                        <span className="profile-name">{p.name}</span>
                        <span className="profile-actions">
                          {source === 'cloud' && (
                            <button
                              className="btn ghost sm"
                              title={S.setConnectHint}
                              onClick={() => copyUrl(p.id)}
                            >
                              {copiedKey === `connect:${p.id}` ? S.aiCopied : S.setConnect}
                            </button>
                          )}
                          <button
                            className="btn ghost sm danger"
                            aria-label={`${S.setDelete}: ${p.name}`}
                            title={`${S.setDelete}: ${p.name}`}
                            onClick={() => deleteProfile(p.id)}
                          >
                            {S.setDelete}
                          </button>
                        </span>
                      </div>
                      {p.hasSecret && source === 'cloud' && (
                        <button className="link-btn sm" onClick={() => revokeSecret(p.id)}>
                          {S.setResetLink}
                        </button>
                      )}
                      {p.natives.length === 0 ? (
                        <p className="ai-note">{S.setEmpty}</p>
                      ) : (
                        <ul className="profile-list">
                          {p.natives.map((n) => (
                            <li
                              key={n.nid}
                              className={`profile-item${activeNativeId === n.nid ? ' active' : ''}`}
                            >
                              <span className="profile-name">
                                {n.name}
                                {n.gender ? ` · ${n.gender === 'male' ? S.setMale : n.gender === 'female' ? S.setFemale : S.setOther}` : ''}
                                {n.isSelf && <em> · {S.setSelf}</em>}
                                {activeNativeId === n.nid && <em> · {S.setActive}</em>}
                              </span>
                              <span className="profile-actions">
                                <button className="btn ghost sm" onClick={() => loadNative(p.id, n.nid)}>
                                  {S.setLoad}
                                </button>
                                {!n.isSelf && (
                                  <button className="btn ghost sm" title={S.setMarkSelf} onClick={() => markSelfNative(p.id, n.nid)}>
                                    {S.setSelf}
                                  </button>
                                )}
                                <button
                                  className="btn ghost sm danger"
                                  aria-label={`${S.setDelete}: ${n.name}`}
                                  title={`${S.setDelete}: ${n.name}`}
                                  onClick={() => deleteNative(p.id, n.nid)}
                                >
                                  {S.setDelete}
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {section === 'ai' && (
              <div>
                <p className="ai-note">
                  {S.setOpenPrompt} — ChatGPT, Claude, Gemini. {S.setMcpUrl} + live tools included.
                </p>
                <button
                  className="btn active"
                  onClick={() => {
                    onClose();
                    onOpenAi();
                  }}
                >
                  {S.setOpenPrompt}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
