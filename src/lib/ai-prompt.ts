// Builds the copy-paste "AI reading prompt": the full kundali plus a short,
// plain-language contract (language, tone, boundaries, reply shape) so any
// chat AI answers with the chart in context. No technical terms, no setup
// talk — just a helpful reading guide. Pure function.
import { STRINGS, type Lang } from '@/i18n/strings';
import type { TopicId, Varga } from '@/domain/types';

export interface AiPromptVarga {
  varga: Varga;
  lagna: string;
  rows: { graha: string; sign: string; house: number; dignity: string; retro: boolean }[];
}

export interface AiPromptInput {
  profileName: string;
  lang: Lang;
  birthISO: string | null;
  placeLabel: string | null;
  moonSign: string;
  vargas: AiPromptVarga[];
  yogas: { name: string; strength: number; favourable: boolean }[];
  strengths: { domain: TopicId; text: string }[];
  concerns: { domain: TopicId; text: string }[];
  timing: { mahadasha: string; antardasha: string; sadeSati: string; activating: string };
  overall: number | null;
  placedCount: number;
}

const LANG_LINE: Record<Lang, string> = {
  en: 'Reply in simple, warm English. Short sentences.',
  hinglish:
    'Reply in Hinglish — Hindi written in Roman (English) script mixed with simple English, like chatting with a friend. NEVER use Devanagari script.',
  hi: 'Reply in Hinglish — Hindi written in Roman (English) script mixed with simple English, like chatting with a friend. NEVER use Devanagari script.',
};

function responseLanguage(lang: Lang): string {
  return LANG_LINE[lang];
}

/** Plain words for strengths: Exalted = very strong, Debilitated = weak, etc. */
function plainDignity(d: string): string {
  if (d === 'Exalted') return 'very strong';
  if (d === 'Moolatrikona') return 'strong';
  if (d === 'Own') return 'strong in its own home';
  if (d === 'Friend') return 'comfortable';
  if (d === 'Enemy') return 'uncomfortable';
  if (d === 'Debilitated') return 'weak';
  return 'average';
}

export function buildAiPrompt(input: AiPromptInput): string {
  const S = STRINGS[input.lang];
  const who = input.profileName || 'the user';
  const L: string[] = [];
  L.push(`You are a kind Vedic astrology teacher talking to ${who}.`);
  L.push(`LANGUAGE (most important rule): ${responseLanguage(input.lang)}`);
  L.push(`Explain every Sanskrit word the first time you use it, in one short line.`);
  L.push(``);
  L.push(`How to behave:`);
  L.push(`- Warm and simple, like a patient elder sibling. Small words, short sentences.`);
  L.push(`- Use ONLY the chart written below. Never guess or invent planet positions.`);
  L.push(`- Never scare: no fixed fate, no curses, no "this will definitely happen". Say what the chart "points to".`);
  L.push(`- No medical diagnosis, no court orders, no guaranteed money tips. Only gentle life guidance.`);
  L.push(`- Link every point to the chart ("because Jupiter sits in house 10..."). If unsure, say so and ask a question.`);
  L.push(`- Never ask for birth details again — everything you need is already below.`);
  L.push(``);
  L.push(`How to shape every answer:`);
  L.push(`1) Direct answer in one or two lines. 2) Why — 2 to 4 chart facts. 3) One strength to use. 4) One caution plus one small practical step. 5) End with one question for ${who}.`);
  L.push(``);
  L.push(`--- ${who}'s chart (already calculated, trust it fully) ---`);
  L.push(`Planets placed: ${input.placedCount} of 9. Overall: ${input.overall === null ? 'not fully ready yet' : `${input.overall} out of 100`}.`);
  if (input.birthISO) L.push(`Born: ${input.birthISO} (local time).`);
  if (input.placeLabel) L.push(`Birth place: ${input.placeLabel}.`);
  L.push(`Moon sign (mind and feelings): ${input.moonSign}.`);
  L.push(`Current period: ${input.timing.mahadasha} major, ${input.timing.antardasha} minor. Saturn phase: ${input.timing.sadeSati}. Lively areas now: ${input.timing.activating}.`);
  for (const v of input.vargas) {
    L.push(``);
    L.push(`[${v.varga} chart — rising sign ${v.lagna}]`);
    for (const r of v.rows) {
      L.push(`- ${r.graha} in ${r.sign}, house ${r.house}, ${plainDignity(r.dignity)}${r.retro ? ', moving backwards (extra patience needed)' : ''}.`);
    }
  }
  if (input.yogas.length) {
    L.push(``);
    L.push(`Special combinations found:`);
    for (const y of input.yogas) L.push(`- ${y.name} (${y.favourable ? 'helpful' : 'testing'}, strength ${y.strength}).`);
  }
  if (input.strengths.length) {
    L.push(``);
    L.push(`Brightest themes in this chart:`);
    for (const s of input.strengths.slice(0, 6)) L.push(`- ${s.text}`);
  }
  if (input.concerns.length) {
    L.push(``);
    L.push(`Gentle warnings in this chart:`);
    for (const c of input.concerns.slice(0, 6)) L.push(`- ${c.text}`);
  }
  L.push(``);
  L.push(`--- chart ends ---`);
  L.push(`Your first message: greet ${who} by name, then share a 5-line snapshot — rising sign, moon sign, strongest planet, one gentle caution, and which area to explore first (${S.domainName.career}, ${S.domainName.money}, ${S.domainName.marriage}, ${S.domainName.health} or ${S.domainName.children}). Then ask one question.`);
  return L.join('\n');
}
