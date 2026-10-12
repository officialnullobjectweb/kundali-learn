'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { useProfileStore } from '@/state/profile-store';
import { buildAiPrompt, type AiPromptInput } from '@/lib/ai-prompt';
import { toastError } from '@/components/ui/Toast';
import { BrandCards, GuidesModal, type GuidePlatform } from './GuidesModal';

type Tab = 'prompt' | 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'kimi' | 'mcp';

const TABS: Tab[] = ['prompt', 'chatgpt', 'claude', 'gemini', 'perplexity', 'kimi', 'mcp'];

function tabLabel(t: Tab, promptLabel: string): string {
  if (t === 'prompt') return promptLabel;
  if (t === 'chatgpt') return 'ChatGPT';
  if (t === 'claude') return 'Claude';
  if (t === 'gemini') return 'Gemini';
  if (t === 'perplexity') return 'Perplexity';
  if (t === 'kimi') return 'Kimi';
  return 'MCP';
}

async function copyText(t: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="ai-steps">
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  );
}

export function AiPromptModal({ input, onClose }: { input: AiPromptInput; onClose: () => void }) {
  const lang = useChartStore((s) => s.lang);
  const { data: session } = useSession();
  const S = STRINGS[lang];
  const [tab, setTab] = useState<Tab>('prompt');
  const [guide, setGuide] = useState<GuidePlatform | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const prompt = useMemo(() => buildAiPrompt(input), [input]);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const mcpUrl = `${origin}/api/mcp`;
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const profiles = useProfileStore((s) => s.profiles);
  const ensureConnectUrl = useProfileStore((s) => s.ensureConnectUrl);
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;
  const [myLink, setMyLink] = useState<string | null>(null);
  useEffect(() => {
    setMyLink(null);
    if (tab !== 'mcp' || !activeProfile) return;
    ensureConnectUrl(activeProfile.id).then(setMyLink).catch(() => undefined);
  }, [tab, activeProfile, ensureConnectUrl]);
  const myMcpUrl = myLink;
  const desktopSnippet = `{\n  "mcpServers": {\n    "kundali-learn": {\n      "url": "${myMcpUrl ?? mcpUrl}"\n    }\n  }\n}`;

  const copy = async (t: string, which: string) => {
    if (await copyText(t)) {
      setCopied(which);
      window.setTimeout(() => setCopied((c) => (c === which ? null : c)), 1800);
    } else {
      toastError(STRINGS[useChartStore.getState().lang].toastCopyFail);
    }
  };

  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="modal ai-modal"
        role="dialog"
        aria-modal="true"
        aria-label={S.aiTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="birth-modal-head">
          <h3>{S.aiTitle}</h3>
          <button className="instr-close" onClick={onClose} aria-label={S.bookClose}>
            ×
          </button>
        </div>
        <div className="ai-tabs" role="tablist" aria-label={S.aiTitle}>
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`ai-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {tabLabel(t, S.aiPrompt)}
            </button>
          ))}
        </div>
        {tab !== 'mcp' && (
          <div className="guide-teaser">
            <span className="ai-note">{S.aiGuideTeaser}</span>
            <BrandCards onOpen={setGuide} />
          </div>
        )}

        {tab === 'prompt' && (
          <div>
            <textarea className="ai-prompt" readOnly value={prompt} rows={14} spellCheck={false} />
            <div className="ai-row">
              <span className="ai-meta">{prompt.length} chars · paste as your first message</span>
              <button className="btn active" onClick={() => copy(prompt, 'prompt')}>
                {copied === 'prompt' ? S.aiCopied : S.aiCopy}
              </button>
            </div>
          </div>
        )}

        {tab === 'chatgpt' && (
          <div>
            <Steps
              items={[
                'Open ChatGPT (free tier is fine) and start a new chat.',
                `Copy the prompt from the "${S.aiPrompt}" tab and send it as your first message.`,
                'Chat normally — your full kundali stays in context, no need to retype birth details.',
                'Tip: keep one chat per person so readings never mix.',
              ]}
            />
            <div className="ai-row">
              <span />
              <button className="btn active" onClick={() => copy(prompt, 'prompt')}>
                {copied === 'prompt' ? S.aiCopied : S.aiCopy}
              </button>
            </div>
          </div>
        )}

        {tab === 'claude' && (
          <div>
            <Steps
              items={[
                'Open Claude and start a new conversation.',
                `Paste the prompt from the "${S.aiPrompt}" tab first — it carries the whole chart plus response rules.`,
                'Optional live link: Claude Settings → Connectors → add a custom MCP server with the URL below. Then Claude can pull charts itself.',
              ]}
            />
            <label className="ai-label">{S.setMcpUrl}</label>
            <div className="ai-row">
              <code className="ai-code">{mcpUrl}</code>
              <button className="btn" onClick={() => copy(mcpUrl, 'url')}>
                {copied === 'url' ? S.aiCopied : S.aiCopy}
              </button>
            </div>
          </div>
        )}

        {tab === 'gemini' && (
          <div>
            <Steps
              items={[
                'Open the Gemini app (or AI Studio) and start a new chat.',
                `Paste the prompt from the "${S.aiPrompt}" tab as the first message.`,
                'Developers: point Gemini CLI at the MCP URL below (settings.json → mcpServers) for live chart tools.',
              ]}
            />
            <div className="ai-row">
              <span />
              <button className="btn active" onClick={() => copy(prompt, 'prompt')}>
                {copied === 'prompt' ? S.aiCopied : S.aiCopy}
              </button>
            </div>
          </div>
        )}

        {tab === 'perplexity' && (
          <div>
            <Steps
              items={[
                'Open Perplexity (perplexity.ai) and start a new thread.',
                `Paste the prompt from the "${S.aiPrompt}" tab as the first message — Perplexity cannot add custom MCP servers, so the pasted chart is its context.`,
                'Ask follow-ups in the same thread; everything stays grounded in your chart.',
              ]}
            />
            <div className="ai-row">
              <span />
              <button className="btn active" onClick={() => copy(prompt, 'prompt')}>
                {copied === 'prompt' ? S.aiCopied : S.aiCopy}
              </button>
            </div>
          </div>
        )}

        {tab === 'kimi' && (
          <div>
            <Steps
              items={[
                'Open Kimi (kimi.moonshot.cn or kimi.com) and start a new chat.',
                `Paste the prompt from the "${S.aiPrompt}" tab as the first message — Kimi's web app cannot add custom MCP servers, so the pasted chart is its context.`,
                'Developers: Kimi K2 via the Moonshot API can call this app’s REST + MCP endpoints with your access token.',
              ]}
            />
            <div className="ai-row">
              <span />
              <button className="btn active" onClick={() => copy(prompt, 'prompt')}>
                {copied === 'prompt' ? S.aiCopied : S.aiCopy}
              </button>
            </div>
          </div>
        )}

        {tab === 'mcp' && (
          <div>
            <BrandCards onOpen={setGuide} />
            <p className="ai-note">
              One link per profile serves its people as live tools — no paste needed once connected. Stateless, works on the free tier.
              Direct MCP link: Claude (Connectors/Desktop/CLI), Gemini CLI, ChatGPT developer/API tools, Kimi K2 API agents.
              ChatGPT, Perplexity and Kimi web apps take custom servers only via the pasted prompt tabs.
              {session?.user?.email ? ` Connected as ${session.user.email} — the AI sees this account's profiles.` : ''}
            </p>
            {myMcpUrl ? (
              <div>
                <label className="ai-label">
                  {S.setCopyLink} · {activeProfile?.name ?? ''} — {S.setConnectHint}
                </label>
                <div className="ai-row">
                  <code className="ai-code">{myMcpUrl}</code>
                  <button className="btn active" onClick={() => copy(myMcpUrl, 'mine')}>
                    {copied === 'mine' ? S.aiCopied : S.aiCopy}
                  </button>
                </div>
              </div>
            ) : (
              <p className="ai-note">{S.setEmpty}</p>
            )}
            <label className="ai-label">{S.setMcpUrl} (shared — lists profiles, never chart data)</label>
            <div className="ai-row">
              <code className="ai-code">{mcpUrl}</code>
              <button className="btn" onClick={() => copy(mcpUrl, 'url')}>
                {copied === 'url' ? S.aiCopied : S.aiCopy}
              </button>
            </div>
            <label className="ai-label">Tools: list_natives · get_native · get_native_varga (personal link) · list_profiles · get_kundali · get_varga (shared link)</label>
            <label className="ai-label">Claude Desktop config (claude_desktop_config.json)</label>
            <textarea className="ai-prompt small" readOnly value={desktopSnippet} rows={7} spellCheck={false} />
            <div className="ai-row">
              <span />
              <span className="ai-row-btns">
                <button className="btn" onClick={() => copy(desktopSnippet, 'snippet')}>
                  {copied === 'snippet' ? S.aiCopied : S.aiCopy}
                </button>
                <button
                  className="btn active"
                  onClick={() => {
                    const blob = new Blob([desktopSnippet], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'kundali-claude-config.json';
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                >
                  {S.setDownloadCfg}
                </button>
              </span>
            </div>
          </div>
        )}
      </div>
      {guide && <GuidesModal platform={guide} onClose={() => setGuide(null)} />}
    </div>
  );
}
