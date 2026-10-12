'use client';

// Picture-first setup tutorials: brand card click -> full image guide.
// Steps use our own screens (always current); external clicks are named
// exactly. Closing words: plain. Companion slash-command table included.
import { useState } from 'react';
import { STRINGS } from '@/i18n/strings';
import { useChartStore } from '@/state/chart-store';
import { ChatGptIcon, ClaudeIcon, GeminiIcon } from './BrandIcons';

export type GuidePlatform = 'claude' | 'gemini' | 'chatgpt';

interface Step {
  img?: string;
  alt?: string;
  text: string;
}

const COPY_LINK: Step = {
  img: '/guide/t-connect.png',
  alt: 'Settings Profiles tab with the Connect button',
  text: '1. Here: Settings → Profiles → Connect. Your personal MCP link is copied.',
};

const STEPS: Record<GuidePlatform, { title: string; steps: Step[] }> = {
  claude: {
    title: 'Claude + your kundali',
    steps: [
      COPY_LINK,
      { img: '/guide/claude-1.png', alt: 'Claude sidebar with Customize highlighted', text: '2. In Claude’s sidebar, click Customize.' },
      { img: '/guide/claude-2.png', alt: 'Customize page, Connectors tab, Add menu with Add custom connector', text: '3. Open the Connectors tab, click + Add, then “Add custom connector”.' },
      { img: '/guide/claude-3.png', alt: 'Add custom connector dialog with name and MCP server URL fields', text: '4. Give it a name (e.g. Kundali Learn), paste your MCP link in the URL field, then Continue.' },
      { text: '5. Ask: “Who can you read?” — pick one person, then ask anything.' },
    ],
  },
  gemini: {
    title: 'Gemini + your kundali',
    steps: [
      COPY_LINK,
      { img: '/guide/gemini-1.png', alt: 'Gemini sidebar with Spark tab and Connected Apps highlighted', text: '2. In Gemini, switch to the Spark tab, then click Connected Apps in the sidebar.' },
      { img: '/guide/gemini-2.png', alt: 'Connected Apps page with Add a custom app highlighted', text: '3. Under “Custom apps”, click “Add a custom app”.' },
      { img: '/guide/gemini-3.png', alt: 'Connect to an MCP server dialog with MCP Server URL field', text: '4. Paste your MCP link in “MCP Server URL” and click Next.' },
      { text: '5. Ask: “Who can you read?” — pick one person, then ask anything.' },
    ],
  },
  chatgpt: {
    title: 'ChatGPT + your kundali',
    steps: [
      COPY_LINK,
      { img: '/guide/chatgpt-1.png', alt: 'ChatGPT sidebar with Plugins highlighted', text: '2. In ChatGPT’s sidebar, click Plugins.' },
      { img: '/guide/chatgpt-2.png', alt: 'Plugins page with Add menu and Add custom MCP server highlighted', text: '3. At the top, click Add, then “Add custom MCP server”.' },
      { img: '/guide/chatgpt-3.png', alt: 'Add custom MCP server dialog with Server URL field', text: '4. Name it (e.g. Kundali Learn), paste your MCP link under Connection → Server URL, tick the trust checkbox, then “Create as a plugin”.' },
      { text: '5. Ask: “Who can you read?” — pick one person, then ask anything.' },
    ],
  },
};

const COMMANDS: { cmd: string; what: string; example: string }[] = [
  { cmd: '/mcp__kundali-learn__list_natives', what: 'Show all saved people.', example: '“Who can you read?”' },
  { cmd: '/mcp__kundali-learn__get_native', what: 'Read one person fully.', example: '“Read Aarav’s full kundali.”' },
  { cmd: '/mcp__kundali-learn__get_native_varga', what: 'One chart of one person.', example: '“Show Aarav’s D9 Navamsha.”' },
  { cmd: '/mcp__kundali-learn__list_profiles', what: 'Show saved families (shared link).', example: '“Which profiles exist?”' },
  { cmd: '/mcp__kundali-learn__get_kundali', what: 'Read a pasted chart (no profile).', example: '“Read this chart: …”' },
  { cmd: '/mcp__kundali-learn__get_varga', what: 'One chart of a pasted chart.', example: '“D10 of this chart?”' },
];

export function BrandCards({ onOpen }: { onOpen: (p: GuidePlatform) => void }) {
  const cards: { p: GuidePlatform; name: string; icon: React.ReactNode }[] = [
    { p: 'claude', name: 'Claude', icon: <ClaudeIcon /> },
    { p: 'gemini', name: 'Gemini', icon: <GeminiIcon /> },
    { p: 'chatgpt', name: 'ChatGPT', icon: <ChatGptIcon /> },
  ];
  return (
    <div className="brand-cards">
      {cards.map((c) => (
        <button key={c.p} className="brand-card" onClick={() => onOpen(c.p)}>
          {c.icon}
          <span>{c.name}</span>
          <span aria-hidden className="brand-go">→</span>
        </button>
      ))}
    </div>
  );
}

export function GuidesModal({ platform, onClose }: { platform: GuidePlatform; onClose: () => void }) {
  const lang = useChartStore((s) => s.lang);
  const S = STRINGS[lang];
  const [imgOk, setImgOk] = useState<Record<string, boolean>>({});
  const g = STEPS[platform];
  const icon = platform === 'claude' ? <ClaudeIcon size={30} /> : platform === 'gemini' ? <GeminiIcon size={30} /> : <ChatGptIcon size={30} />;
  return (
    <div className="modal-veil guide-veil" onClick={onClose}>
      <div
        className="modal guide-modal"
        role="dialog"
        aria-modal="true"
        aria-label={g.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="birth-modal-head">
          <h3 className="guide-title">
            {icon} {g.title}
          </h3>
          <button className="instr-close" onClick={onClose} aria-label={S.bookClose}>
            ×
          </button>
        </div>
        <div className="guide-steps">
          {g.steps.map((s, i) => (
            <div key={i} className="guide-step">
              {s.img && imgOk[s.img] !== false && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.img}
                  alt={s.alt}
                  className="guide-img"
                  loading="lazy"
                  onError={() => setImgOk((m) => ({ ...m, [s.img as string]: false }))}
                />
              )}
              <p>{s.text}</p>
            </div>
          ))}
        </div>
        <h4 className="guide-sub">Commands — copy, paste, done</h4>
        <ul className="cmd-list">
          {COMMANDS.map((c) => (
            <li key={c.cmd} className="cmd">
              <code>{c.cmd}</code>
              <span>{c.what}</span>
              <span className="cmd-ex">{c.example}</span>
            </li>
          ))}
        </ul>
        <p className="ai-note">On Claude / Gemini web chat, just ask in words — same result, no slashes needed.</p>
      </div>
    </div>
  );
}
