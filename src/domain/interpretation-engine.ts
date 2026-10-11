// Interpretation engine: structured evidence -> extremely simple language,
// in English, Hinglish or Hindi. Construction rule: every sentence is BUILT
// from evidence fields (planet names, house numbers, dignities via plain-word
// maps), so nothing can be invented. Simple sections avoid Sanskrit terms in
// every language; the expandable technical section quotes raw rule records.

import { DOMAIN_DEFS } from './domains';
import { STRINGS, type Lang } from '../i18n/strings';
import type {
  Bhava,
  Dignity,
  DomainAnalysis,
  Evidence,
  Graha,
  Interpretation,
  InterpretationSentence,
} from './types';

/** Plain area names per house, in the reader's language. */
function areaOf(house: number, lang: Lang): string {
  const themes = STRINGS[lang].themes[house as Bhava];
  const joined = themes ? themes.join(', ') : `house ${house}`;
  return lang === 'en' ? joined.toLowerCase() : joined;
}

const DIGNITY_PLAIN: Record<Lang, Record<Dignity, string>> = {
  en: {
    Exalted: 'unusually strong',
    Moolatrikona: 'very strong in its own place',
    Own: 'strong in its own place',
    Friend: 'supported',
    Neutral: 'about average',
    Enemy: 'uncomfortable',
    Debilitated: 'weak',
  },
  hinglish: {
    Exalted: 'asamanya bali',
    Moolatrikona: 'apne sthan mein bahut bali',
    Own: 'apne ghar mein bali',
    Friend: 'samarthit',
    Neutral: 'ausat',
    Enemy: 'asahaj',
    Debilitated: 'kamzor',
  },
  hi: {
    Exalted: 'असामान्य रूप से बली',
    Moolatrikona: 'अपने स्थान में अत्यंत बली',
    Own: 'अपने घर में बली',
    Friend: 'समर्थित',
    Neutral: 'औसत',
    Enemy: 'असहज',
    Debilitated: 'कमज़ोर',
  },
};

const IMPORTANT = [1, 4, 5, 7, 9, 10];
const DIFFICULT = [6, 8, 12];

const s = (text: string, ...evidence: Evidence[]): InterpretationSentence => ({
  text,
  evidenceIds: evidence.map((e) => e.id),
});

const lowerFirst = (t: string, lang: Lang): string =>
  lang === 'hi' ? t : t.charAt(0).toLowerCase() + t.slice(1);

function grahaName(g: string, lang: Lang): string {
  return STRINGS[lang].graha[g as Graha] ?? g;
}

/** "A, B" with localized planet names. */
function localizeList(raw: string, lang: Lang): string {
  if (lang === 'en' || raw === '') return raw;
  return raw
    .split(',')
    .map((x) => grahaName(x.trim(), lang))
    .join(', ');
}

function factorName(f: string, lang: Lang): string {
  if (f.startsWith('Bhava:')) {
    const n = f.split(':')[1];
    return lang === 'en'
      ? `house ${n}`
      : lang === 'hinglish'
        ? `ghar ${n}`
        : `घर ${n}`;
  }
  return grahaName(f, lang);
}

/**
 * One evidence record -> one plain sentence. Branches only on structured
 * inputs, never on free text, so the wording cannot drift from the fact.
 */
export function simplifyEvidence(e: Evidence, domainLabel: string, lang: Lang = 'en'): string {
  const i = e.inputs;
  const label = lang === 'en' ? domainLabel.toLowerCase() : domainLabel;

  if (typeof i.varga === 'string') {
    const lord = grahaName(String(i.lord ?? ''), lang) || 'it';
    if (lang === 'hi') {
      return e.direction === 'POSITIVE'
        ? `${lord} का बल सूक्ष्म कुंडली में भी दिखता है, इसलिए टिकने की संभावना है।`
        : `${lord} का वादा सूक्ष्म कुंडली में फीका पड़ता है, इसलिए निरंतर प्रयास ज़रूरी है।`;
    }
    if (lang === 'hinglish') {
      return e.direction === 'POSITIVE'
        ? `${lord} ka bal sookshm kundali mein bhi dikhta hai, isliye tikne ki sambhavna hai.`
        : `${lord} ka vaada sookshm kundali mein feeka padta hai, isliye nirantar prayas zaroori hai.`;
    }
    return e.direction === 'POSITIVE'
      ? `The strength of ${lord} also shows in the finer chart, so it is likely to last.`
      : `The promise of ${lord} fades in the finer chart, so steady effort matters more.`;
  }
  if (typeof i.lord === 'string' && typeof i.dignity === 'string') {
    const place = IMPORTANT.includes(Number(i.house))
      ? 'important'
      : DIFFICULT.includes(Number(i.house))
        ? 'difficult'
        : '';
    const dignity = DIGNITY_PLAIN[lang][i.dignity as Dignity] ?? String(i.dignity);
    const lord = grahaName(i.lord, lang);
    if (lang === 'hi') {
      return `आपके ${label} का स्वामी ग्रह ${lord} ${dignity} है।${place === 'important' ? ' यह जीवन के महत्वपूर्ण क्षेत्र का स्वामी है।' : place === 'difficult' ? ' यह जीवन के कठिन क्षेत्र का स्वामी है।' : ''}`;
    }
    if (lang === 'hinglish') {
      return `Aapke ${label} ka swami grah ${lord} ${dignity} hai.${place === 'important' ? ' Yeh jeevan ke mahatvapurna kshetra ka swami hai.' : place === 'difficult' ? ' Yeh jeevan ke kathin kshetra ka swami hai.' : ''}`;
    }
    return `The planet responsible for your ${label} is ${dignity}.${place === 'important' ? ' It governs an important area of life.' : place === 'difficult' ? ' It governs a difficult area of life.' : ''}`;
  }
  if (typeof i.yoga === 'string') {
    const yoga = String(i.yoga);
    if (lang === 'hi') return `${yoga} बनता है — ${label} का समर्थन करने वाला पारंपरिक योग।`;
    if (lang === 'hinglish') return `${yoga} banta hai — ${label} ka samarthan karne wala paramparik yog.`;
    return `${yoga} forms — a traditional combination supporting ${label}.`;
  }
  if (e.ruleId.includes('afflict') || 'with' in i) {
    const g = typeof i.graha === 'string' ? grahaName(i.graha, lang) : lang === 'hi' ? 'एक मुख्य ग्रह' : lang === 'hinglish' ? 'Ek mukhya grah' : 'A key planet';
    const withPart =
      typeof i.with === 'string' && i.with !== '' && i.with !== 'none'
        ? lang === 'hi'
          ? `, ${localizeList(i.with, lang)} के साथ`
          : lang === 'hinglish'
            ? `, ${localizeList(i.with, lang)} ke saath`
            : `, sharing space with ${i.with}`
        : '';
    if (lang === 'hi') return `${g} दबाव में है${withPart}, जो ${label} पर भारी पड़ता है।`;
    if (lang === 'hinglish') return `${g} dabaav mein hai${withPart}, jo ${label} par bhaari padta hai.`;
    return `${g} is under pressure${withPart}, which weighs on ${label}.`;
  }
  if (typeof i.graha === 'string' && typeof i.dignity === 'string' && typeof i.house !== 'number') {
    const g = grahaName(i.graha, lang);
    const dignity = DIGNITY_PLAIN[lang][i.dignity as Dignity] ?? String(i.dignity);
    const verb = e.direction === 'POSITIVE'
      ? lang === 'hi' ? 'सहायक' : lang === 'hinglish' ? 'sahayak' : 'helps'
      : lang === 'hi' ? 'बाधक' : lang === 'hinglish' ? 'badhak' : 'strains';
    if (lang !== 'en') return `${g} ${dignity} है, जो ${label} में ${verb} है।`.replace('।', lang === 'hinglish' ? '.' : '।');
    return `${g} is ${dignity}, which ${verb} ${label}.`;
  }
  if (typeof i.graha === 'string' && typeof i.house === 'number' && typeof i.dignity !== 'string') {
    const g = grahaName(i.graha, lang);
    const area = areaOf(i.house, lang);
    const verb = e.direction === 'POSITIVE'
      ? lang === 'hi' ? 'सहायक' : lang === 'hinglish' ? 'sahayak' : 'helps'
      : lang === 'hi' ? 'बाधक' : lang === 'hinglish' ? 'badhak' : 'strains';
    if (lang === 'hi') return `${g} आपके ${area} क्षेत्र में है, जो ${verb} है।`;
    if (lang === 'hinglish') return `${g} aapke ${area} kshetra mein hai, jo ${verb} hai.`;
    return `${g} sits in your ${area} area, which ${verb} it.`;
  }
  if (typeof i.by === 'string') {
    const by = grahaName(i.by, lang);
    const add = e.direction === 'POSITIVE'
      ? lang === 'hi' ? 'समर्थन' : lang === 'hinglish' ? 'samarthan' : 'support'
      : lang === 'hi' ? 'तनाव' : lang === 'hinglish' ? 'tanaav' : 'strain';
    if (typeof i.house === 'number') {
      const area = areaOf(i.house, lang);
      if (lang === 'hi') return `${by} आपके ${area} को देखता है, ${add} जोड़ता है।`;
      if (lang === 'hinglish') return `${by} aapke ${area} ko dekhta hai, ${add} jodta hai.`;
      return `${by} watches over your ${area}, adding ${add}.`;
    }
    const target = typeof i.lord === 'string' ? grahaName(i.lord, lang) : '';
    if (lang === 'hi') return `${by} ${target} ग्रह को देखता है, ${add} जोड़ता है।`;
    if (lang === 'hinglish') return `${by} ${target} grah ko dekhta hai, ${add} jodta hai.`;
    return `${by} watches over the planet ${target}, adding ${add}.`;
  }
  if (e.ruleId === 'retrograde' || e.ruleId.includes('retro')) {
    const g = typeof i.graha === 'string' ? grahaName(i.graha, lang) : lang === 'hi' ? 'यह ग्रह' : lang === 'hinglish' ? 'Yeh grah' : 'This planet';
    if (lang === 'hi') return `${g} अभी धीमा चलता प्रतीत होता है — इसके फल देर से मिलते हैं, मिलते ज़रूर हैं।`;
    if (lang === 'hinglish') return `${g} abhi dheema chalta pratit hota hai — iske phal der se milte hain, milte zaroor hain.`;
    return `${g} appears to move slowly now — its gifts arrive late, not denied.`;
  }
  const factors = e.affectedFactors.map((f) => factorName(f, lang)).join(', ') || (lang === 'hi' ? 'यह क्षेत्र' : lang === 'hinglish' ? 'yeh kshetra' : 'this area');
  if (lang === 'hi') return `एक कारक ${factors} को छूता है।`;
  if (lang === 'hinglish') return `Ek kaarak ${factors} ko chhoota hai.`;
  return `One factor touches ${factors}.`;
}

const BAND: Record<Lang, (score: number) => string> = {
  en: (score) => (score >= 75 ? 'strong' : score >= 60 ? 'good' : score <= 40 ? 'difficult' : 'mixed'),
  hinglish: (score) => (score >= 75 ? 'mazboot' : score >= 60 ? 'achchha' : score <= 40 ? 'kathin' : 'mishrit'),
  hi: (score) => (score >= 75 ? 'मज़बूत' : score >= 60 ? 'अच्छा' : score <= 40 ? 'कठिन' : 'मिश्रित'),
};

const HEAD: Record<Lang, { supported: string; strained: string; mixed: string; needsMore: string }> = {
  en: { supported: 'supported', strained: 'strained', mixed: 'mixed', needsMore: 'needs more signs' },
  hinglish: { supported: 'samarthit', strained: 'tanaavgrast', mixed: 'mishrit', needsMore: 'aur sanket chahiye' },
  hi: { supported: 'समर्थित', strained: 'तनावग्रस्त', mixed: 'मिश्रित', needsMore: 'और संकेत चाहिए' },
};

function headlineFor(label: string, blocked: boolean, score: number, lang: Lang): string {
  const h = HEAD[lang];
  if (blocked) return `${label}: ${h.needsMore}`;
  if (score >= 60) return `${label}: ${h.supported}`;
  if (score <= 40) return `${label}: ${h.strained}`;
  return `${label}: ${h.mixed}`;
}

/**
 * Timing sentence. The dasha period is computed data, not evidence — so it
 * is only stated when evidence IDs of the involved lords exist to cite.
 * Otherwise it is omitted rather than invented.
 */
function timingSentence(a: DomainAnalysis, lang: Lang): InterpretationSentence | null {
  const md = a.timing.currentMahadasha;
  const ad = a.timing.currentAntardasha;
  if (!md || !ad) return null;
  const cited = [...a.supporting, ...a.contradicting].filter(
    (e) => e.affectedFactors.includes(md) || e.affectedFactors.includes(ad),
  );
  if (cited.length === 0) return null;
  const mdName = grahaName(md, lang);
  const adName = grahaName(ad, lang);
  const active = a.timing.state === 'activating'
    ? lang === 'hi'
      ? 'इसलिए ये विषय अभी दैनिक जीवन में जागृत हैं'
      : lang === 'hinglish'
        ? 'isliye ye vishay abhi dainik jeevan mein jaagrit hain'
        : 'so these themes are awake in daily life right now'
    : lang === 'hi'
      ? 'इसलिए ये विषय अभी पृष्ठभूमि में विश्राम कर रहे हैं'
      : lang === 'hinglish'
        ? 'isliye ye vishay abhi prishthabhoomi mein vishram kar rahe hain'
        : 'so these themes rest in the background right now';
  const text = lang === 'hi'
    ? `${mdName} की वर्तमान बड़ी अवधि और ${adName} की छोटी अवधि का अर्थ है ${active}।`
    : lang === 'hinglish'
      ? `${mdName} ka vartaman bada daur aur ${adName} ka chhota daur — ${active}.`
      : `The current major period of ${md} with the sub-period of ${ad} means ${active}.`;
  return s(text, ...cited.slice(0, 2));
}

const LEVEL: Record<Lang, (c: number) => string> = {
  en: (c) => (c >= 0.6 ? 'high' : c >= 0.35 ? 'moderate' : 'low'),
  hinglish: (c) => (c >= 0.6 ? 'zyada' : c >= 0.35 ? 'madhyam' : 'kam'),
  hi: (c) => (c >= 0.6 ? 'उच्च' : c >= 0.35 ? 'मध्यम' : 'निम्न'),
};

export function interpretAnalysis(a: DomainAnalysis, lang: Lang = 'en'): Interpretation {
  const def = DOMAIN_DEFS[a.domain];
  const label = lang === 'en' ? def.label : STRINGS[lang].domainName[a.domain];
  const headline = headlineFor(label, a.blocked, a.score, lang);

  if (a.blocked) {
    const none: InterpretationSentence[] = [
      lang === 'hi'
        ? { text: `अभी ${label} के बारे में कहने को पर्याप्त नहीं है।`, evidenceIds: [] }
        : lang === 'hinglish'
          ? { text: `Abhi ${label} ke baare mein kehne ko paryapt nahi hai.`, evidenceIds: [] }
          : { text: `There is not enough to say about ${label.toLowerCase()} yet.`, evidenceIds: [] },
    ];
    return {
      topic: a.domain, headline, shortExplanation: none, whyThisHappened: none,
      supporting: [], contradicting: [], confidence: 0,
      confidenceNote: [
        lang === 'hi'
          ? { text: 'कोई विश्वास नहीं दिया जा सकता — और स्वतंत्र संकेत चाहिए।', evidenceIds: [] }
          : lang === 'hinglish'
            ? { text: 'Koi vishwas nahi diya ja sakta — aur swatantra sanket chahiye.', evidenceIds: [] }
            : { text: 'No confidence can be given — more independent signs are needed.', evidenceIds: [] },
      ],
      technical: [],
      score: a.score, direction: a.direction, blocked: true,
    };
  }

  const n = a.supporting.length;
  const m = a.contradicting.length;
  const topFor = a.supporting[0];
  const topAgainst = a.contradicting[0];
  const summaryIds = [topFor, topAgainst].filter((e): e is Evidence => !!e);

  const shortExplanation: InterpretationSentence[] = [
    s(
      lang === 'hi'
        ? `आपके ${label} क्षेत्र को ${BAND[lang](a.score)} समर्थन मिलता है।`
        : lang === 'hinglish'
          ? `Aapke ${label} kshetra ko ${BAND[lang](a.score)} samarthan milta hai.`
          : `Your ${label.toLowerCase()} area receives ${BAND[lang](a.score)} support.`,
      ...summaryIds,
    ),
    s(
      lang === 'hi'
        ? `समर्थक संकेत: ${n}; चिंताएँ: ${m}।`
        : lang === 'hinglish'
          ? `Samarthak sanket: ${n}; chintayein: ${m}.`
          : `Supporting signs: ${n}; concerns: ${m}.`,
      ...summaryIds,
    ),
  ];

  const whyThisHappened: InterpretationSentence[] = a.supporting
    .slice(0, 2)
    .map((e) => s(simplifyEvidence(e, label, lang), e));
  const timing = timingSentence(a, lang);
  if (timing) whyThisHappened.push(timing);
  if (topAgainst) {
    const concern = simplifyEvidence(topAgainst, label, lang);
    whyThisHappened.push(
      s(
        lang === 'hi'
          ? `मुख्य चिंता: ${concern}`
          : lang === 'hinglish'
            ? `Mukhya chinta: ${concern}`
            : `The main concern is simple: ${lowerFirst(concern, lang)}`,
        topAgainst,
      ),
    );
  }

  const supporting = a.supporting.map((e) => s(simplifyEvidence(e, label, lang), e));
  const contradicting = a.contradicting.map((e) => s(simplifyEvidence(e, label, lang), e));

  const k = n + m;
  const both = m > 0 && n > 0;
  const confidenceNote: InterpretationSentence[] = [
    s(
      lang === 'hi'
        ? `विश्वास ${LEVEL[lang](a.confidence)} है: ${k} स्वतंत्र तथ्य${both ? ', जो अलग दिशाओं में खींचते हैं' : ''}।`
        : lang === 'hinglish'
          ? `Vishwas ${LEVEL[lang](a.confidence)} hai: ${k} swatantra tathya${both ? ', jo alag dishaon mein kheenchein' : ''}.`
          : `Confidence is ${LEVEL[lang](a.confidence)}: ${k} independent facts${both ? ', pulling in different directions' : ''}.`,
      ...[...a.supporting, ...a.contradicting],
    ),
  ];

  const technical: InterpretationSentence[] = [...a.supporting, ...a.contradicting, ...a.neutral].map(
    (e) =>
      s(
        `"${e.reason}" — rule ${e.ruleId}, chart ${e.sourceChart}, relevance ${e.relevance}, inputs ${JSON.stringify(e.inputs)}.`,
        e,
      ),
  );

  return {
    topic: a.domain, headline, shortExplanation, whyThisHappened,
    supporting, contradicting, confidence: a.confidence, confidenceNote, technical,
    score: a.score, direction: a.direction, blocked: false,
  };
}

/**
 * Traceability audit. Returns violation strings; empty means every sentence
 * is grounded. Uncited sentences are allowed ONLY on blocked analyses.
 */
export function verifyInterpretation(interp: Interpretation, pool: Evidence[]): string[] {
  const ids = new Set(pool.map((e) => e.id));
  const problems: string[] = [];
  const sections: [string, InterpretationSentence[]][] = [
    ['shortExplanation', interp.shortExplanation],
    ['whyThisHappened', interp.whyThisHappened],
    ['supporting', interp.supporting],
    ['contradicting', interp.contradicting],
    ['confidenceNote', interp.confidenceNote],
    ['technical', interp.technical],
  ];
  for (const [name, sentences] of sections) {
    for (const st of sentences) {
      if (st.evidenceIds.length === 0 && !interp.blocked) {
        problems.push(`${name}: uncited sentence "${st.text.slice(0, 60)}"`);
      }
      for (const id of st.evidenceIds) {
        if (!ids.has(id)) problems.push(`${name}: unknown evidence id ${id}`);
      }
    }
  }
  return problems;
}
