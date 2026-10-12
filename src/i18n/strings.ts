// UI strings in English, Hinglish and Hindi. Proper nouns (graha/rashi/
// nakshatra) carry real transliterations, not machine translation.
// Numbers and degrees are never translated — they render identically.

import type { Bhava, Graha, TopicId } from '../domain/types';
import { RASHI_NAMES } from '../domain/types';
import { HOUSE_THEMES, NAKSHATRA_NAMES } from '../domain/constants';

export type Lang = 'en' | 'hinglish' | 'hi';
export type ViewKey = 'D1' | 'CHANDRA' | 'D4' | 'D6' | 'D7' | 'D9' | 'D10' | 'D60';

export interface ViewCopy {
  label: string;
  tagline: string;
  about: string;
}

export interface UIStrings {
  title: string;
  subtitle: string;
  trayTitle: string;
  traySub: string;
  trayHint: string;
  panelEmpty: string;
  fDegree: string;
  fRashi: string;
  fHouse: string;
  fNakshatra: string;
  fDignity: string;
  fLifeAreas: string;
  fLord: string;
  fOccupants: string;
  fAspects: string;
  empty: string;
  setAsAsc: string;
  combust: string;
  retro: string;
  houseWord: string;
  explore: string;
  keep: string;
  discard: string;
  resetExperiment: string;
  whatIfTitle: string;
  beforeCol: string;
  afterCol: string;
  noChanges: string;
  more: string;
  trayEmpty: string;
  guideLabel: string;
  guideStep1: string;
  guideStep2: string;
  tplLabel: string;
  tplClassic: string;
  tplMidnight: string;
  tplSand: string;
  lgLabel: string;
  lgExalted: string;
  lgDebilitated: string;
  lgRetro: string;
  sideInspect: string;
  sideReading: string;
  sideInsights: string;
  sideOverview: string;
  hSupporting: string;
  hAgainst: string;
  hConfidence: string;
  hTechnical: string;
  bookOpen: string;
  bookClose: string;
  bookCover: string;
  bookIncomplete: string;
  bookMethod: string;
  methodNotes: string[];
  tagline: string;
  themeToggle: string;
  howItWorks: string;
  howTitle: string;
  howSteps: string[];
  instrLine1: string;
  instrLine2: string;
  instrClose: string;
  allCats: string;
  inPhysical: string;
  inMental: string;
  inComplete: string;
  inPlanetCov: string;
  inHouseCov: string;
  inStrongest: string;
  inWeakest: string;
  inDignity: string;
  inRetro: string;
  inExalted: string;
  inDebilitated: string;
  inNeedMore: string;
  inYogas: string;
  bdTitle: string;
  bdName: string;
  bdPlace: string;
  bdDate: string;
  bdCity: string;
  bdCustom: string;
  bdLat: string;
  bdLon: string;
  bdSubmit: string;
  bdInvalid: string;
  bdNote: string;
  locPlaceholder: string;
  locDontKnow: string;
  calPlaceholder: string;
  calApply: string;
  calClear: string;
  calToday: string;
  calPickHint: string;
  calTime: string;
  calHour: string;
  calMinute: string;
  calDone: string;
  locHint: string;
  pinHint: string;
  locNone: string;
  locApprox: string;
  locClear: string;
  inOverall: string;
  inTimingNow: string;
  inSadeSati: string;
  inActiveNow: string;
  inOpposite: string;
  inRelated: string;
  domainName: Record<TopicId, string>;
  views: Record<ViewKey, ViewCopy>;
  qaAi: string;
  aiTitle: string;
  aiPrompt: string;
  aiCopy: string;
    aiCopied: string;
  aiGuideTeaser: string;  setTitle: string;
  setProfiles: string;
  setAi: string;
  setSaveCurrent: string;
  setNamePh: string;
  setLoad: string;
  setDelete: string;
  setEmpty: string;
  setCloud: string;
  setLocal: string;
  setOpenPrompt: string;
  setMcpUrl: string;
  setActive: string;
  setConnect: string;
  setConnectHint: string;
  setSelf: string;
  setMarkSelf: string;
  setGender: string;
  setMale: string;
  setFemale: string;
  setOther: string;
  setNewProfile: string;
  setProfileName: string;
  setCreate: string;
  setCopyLink: string;
  setResetLink: string;
  setDownloadCfg: string;
  toastNoChart: string;
  toastNoLink: string;
  toastCopyFail: string;
  authTitle: string;
  authLogin: string;
  authSignup: string;
  authEmail: string;
  authPassword: string;
  authGoogle: string;
  authFail: string;
  authLogout: string;
  authDob: string;
  authTob: string;
  authPob: string;
  graha: Record<Graha, string>;
  rashi: string[];
  nakshatra: string[];
  themes: Record<Bhava, string[]>;
}

const EN: UIStrings = {
  title: 'Kundali Learn',
  subtitle: 'Drag planets and rashis — every dependent property recalculates instantly.',
  trayTitle: 'Add Planets',
  traySub: 'Drag the planets into houses',
  trayHint:
    'Tip: drop any rashi number onto any house and the whole chart fills in. Tap a planet, then tap a house, to move without dragging.',
  panelEmpty: 'Hover a planet, rashi, or house — or tap to select.',
  fDegree: 'Degree',
  fRashi: 'Rashi',
  fHouse: 'House',
  fNakshatra: 'Nakshatra',
  fDignity: 'Dignity',
  fLifeAreas: 'Life areas',
  fLord: 'Lord',
  fOccupants: 'Occupants',
  fAspects: 'Aspects',
  empty: '— empty —',
  setAsAsc: 'Set as ascendant',
  combust: 'combust',
  retro: 'retrograde',
  houseWord: 'House',
  explore: 'Enter Explore (what-if)',
  keep: 'Keep as birth',
  discard: 'Exit explore',
  resetExperiment: 'Reset Experiment',
  whatIfTitle: 'What changed',
  beforeCol: 'Before',
  afterCol: 'After',
  noChanges: 'No changes yet — drag a planet or move the ascendant to experiment.',
  more: 'Why this reading',
  trayEmpty: 'All planets are placed. Drag one back here to remove it.',
  guideLabel: 'Getting started',
  guideStep1: 'Set the rashis first — drop any rashi number onto any house; all twelve houses fill in automatically.',
  guideStep2: 'Then place the planets — drag them from the tray into houses. Rahu and Ketu always move together, 180° apart.',
  tplLabel: 'Chart style',
  tplClassic: 'Classic',
  tplMidnight: 'Midnight',
  tplSand: 'Sand',
  lgLabel: 'Planet markers',
  lgExalted: 'exalted',
  lgDebilitated: 'debilitated',
  lgRetro: 'retrograde',
  sideInspect: 'Inspect',
  sideReading: 'Reading',
  sideInsights: 'Insights',
  sideOverview: 'Overview',
  hSupporting: 'What supports this',
  hAgainst: 'What weighs against',
  hConfidence: 'Confidence',
  hTechnical: 'Technical detail',
  bookOpen: 'Full reading',
  bookClose: 'Close',
  bookCover: 'Birth chart at a glance',
  bookIncomplete: 'Place all 9 planets for the complete book — open sections show what is known so far.',
  bookMethod: 'How to read this',
  methodNotes: [
    'Positions are calculated, not guessed — every number traces to the ephemeris or your input.',
    'Scores show a lean, not a certainty — 72 is not a 72% chance.',
    'Houses are whole-sign: one rashi, one house.',
    'Timing needs a birth date and time; without it, timing lines stay silent.',
  ],
  tagline: 'Drag • Explore • Understand',
  themeToggle: 'Toggle dark theme',
  howItWorks: 'How it works?',
  howTitle: 'Learn by playing with the kundali',
  howSteps: [
    'Set the rashis first — any rashi onto any house.',
    'Drag planets from the left into houses.',
    'Click a house or planet to inspect it.',
    'Change placements and watch every reading update.',
  ],
  instrLine1: 'Set the rashis first — drop any rashi number onto any house; all twelve houses fill automatically.',
  instrLine2: 'Then place the planets — drag them from the left into houses. Rahu and Ketu always move together, 180° apart.',
  instrClose: 'Hide instructions',
  allCats: 'All',
  inPhysical: 'Physical Energy',
  inMental: 'Mental Strength',
  inComplete: 'Chart completeness',
  inPlanetCov: 'Planet coverage',
  inHouseCov: 'House coverage',
  inStrongest: 'Strongest area',
  inWeakest: 'Weakest area',
  inDignity: 'Planetary dignity',
  inRetro: 'Retrograde planets',
  inExalted: 'Exalted planets',
  inDebilitated: 'Debilitated planets',
  inNeedMore: 'Add more planets',
  inYogas: 'Classical combinations',
  bdTitle: 'Birth details',
  bdName: 'Name',
  bdPlace: 'Place of birth',
  bdDate: 'Date and time of birth',
  bdCity: 'City',
  bdCustom: 'Custom coordinates',
  bdLat: 'Latitude',
  bdLon: 'Longitude',
  bdSubmit: 'Make my chart',
  bdInvalid: 'Please check the date, time and place.',
  bdNote: 'Enter local birth time; it is converted using this device timezone.',
  locPlaceholder: 'village, City',
  locDontKnow: "Don't know placement?",
  calPlaceholder: 'Select date and time',
  calApply: 'Apply',
  calClear: 'Clear',
  calToday: 'Today',
  calPickHint: 'Tap the title to pick month & year',
  calTime: 'Time',
  calHour: 'Hour',
  calMinute: 'Minute',
  calDone: 'Done',
  locHint: 'Villages and world places load from the map directory.',
  pinHint: 'Pincode detected — resolving its area.',
  locNone: 'No match found. Try a nearby town or pincode.',
  locApprox: 'approx',
  locClear: 'Clear place',
  inOverall: 'Overall indication',
  inTimingNow: 'Timing now',
  inSadeSati: 'Sade-sati',
  inActiveNow: 'Active themes now',
  inOpposite: 'Opposite house',
  inRelated: 'Related houses',
  domainName: {
    career: 'Career', money: 'Wealth', marriage: 'Marriage', relationships: 'Relationships',
    education: 'Education', family: 'Family', property: 'Property', children: 'Children',
    health: 'Health', spirituality: 'Spirituality', personality: 'Personality', general: 'General',
  },
  views: {
    D1: {
      label: 'D1 · Birth',
      tagline: 'Main life chart',
      about:
        'The birth chart. Every life area — health, wealth, marriage, career — is read from its house, counted from the ascendant. Houses are whole-sign: one rashi, one house.',
    },
    CHANDRA: {
      label: 'Chandra Lagna',
      tagline: 'Life viewed from the Moon',
      about:
        'Same planets, houses counted from the Moon rashi instead of the ascendant. Shows mind, emotions, and how you experience events.',
    },
    D4: {
      label: 'D4 · Chaturthamsha',
      tagline: 'Property and fortune',
      about:
        'Each rashi split into 4 parts. Read the houses here for property, home, fixed assets and fortune.',
    },
    D6: {
      label: 'D6 · Shashtamsha',
      tagline: 'Health and obstacles',
      about:
        'Each rashi split into 6 parts. Read the houses here for health, debts, enemies and everyday struggles.',
    },
    D7: {
      label: 'D7 · Saptamsha',
      tagline: 'Children and creativity',
      about:
        'Each rashi split into 7 parts. Read the houses here for children, progeny and creative fruits.',
    },
    D9: {
      label: 'D9 · Navamsha',
      tagline: 'Deeper strength and dharma',
      about:
        'Each rashi split into 9 parts. Shows inner strength, maturity, marriage and dharma — a planet strong in D9 delivers its promises.',
    },
    D10: {
      label: 'D10 · Dashamsha',
      tagline: 'Career and profession',
      about:
        'Each rashi split into 10 parts. Read the houses here for work, status, authority and worldly karma.',
    },
    D60: {
      label: 'D60 · Shashtiamsha',
      tagline: 'Past karma, finest detail',
      about:
        'Each rashi split into 60 parts of half a degree. The finest lens — past-life karma behind everything. Needs exact birth time.',
    },
  },
  qaAi: 'AI Reading',
  aiTitle: 'AI Reading',
  aiPrompt: 'Prompt',
  aiCopy: 'Copy prompt',
  aiCopied: 'Copied!',
  aiGuideTeaser: 'Tap a logo for the picture guide',
  setTitle: 'Settings',
  setProfiles: 'Profiles',
  setAi: 'AI & Sharing',
  setSaveCurrent: 'Save current chart',
  setNamePh: 'Name, e.g. Aarav',
  setLoad: 'Load',
  setDelete: 'Delete',
  setEmpty: 'No profiles yet — save the current chart above.',
  setCloud: 'Cloud (MongoDB)',
  setLocal: 'On this device',
  setOpenPrompt: 'Open AI reading prompt',
  setMcpUrl: 'MCP server URL',
  setActive: 'Active',
  setConnect: 'Connect',
  setConnectHint: 'Personal AI link — the AI opens this profile automatically',
  setSelf: 'Self',
  setMarkSelf: 'Set as self',
  setGender: 'Gender',
  setMale: 'Male',
  setFemale: 'Female',
  setOther: 'Other',
  setNewProfile: 'New profile',
  setProfileName: 'Profile name, e.g. Family',
  setCreate: 'Create',
  setCopyLink: 'Copy AI link',
  setResetLink: 'Reset link',
  setDownloadCfg: 'Download config file',
  toastNoChart: 'Nothing to save yet — build the chart first.',
  toastNoLink: 'Connect needs internet and database — try again.',
  toastCopyFail: 'Copy failed — touch and hold the text to copy it.',
  authTitle: 'Your account',
  authLogin: 'Log in',
  authSignup: 'Sign up',
  authEmail: 'Email',
  authPassword: 'Password (8+ characters)',
  authGoogle: 'Continue with Google',
  authFail: 'That did not work — check email and password.',
  authLogout: 'Log out',
  authDob: 'Born',
  authTob: 'Time',
  authPob: 'Place',
  graha: {
    Sun: 'Sun',
    Moon: 'Moon',
    Mars: 'Mars',
    Mercury: 'Mercury',
    Jupiter: 'Jupiter',
    Venus: 'Venus',
    Saturn: 'Saturn',
    Rahu: 'Rahu',
    Ketu: 'Ketu',
  },
  rashi: [...RASHI_NAMES],
  nakshatra: [...NAKSHATRA_NAMES],
  themes: HOUSE_THEMES,
};

const HINGLISH: UIStrings = {
  ...EN,
  subtitle: 'Grahon aur rashiyon ko kheenchkar chhodein — har cheez turant dobara calculate hoti hai.',
  trayTitle: 'Grah Jodein',
  traySub: 'Grahon ko gharon mein kheenchein',
  trayHint:
    'Tip: kisi bhi rashi number ko kisi bhi ghar par chhodein, poori kundali apne aap bhar jayegi. Bina drag ke: pehle grah tap karein, phir ghar tap karein.',
  panelEmpty: 'Kisi grah, rashi ya ghar par hover karein — ya chunne ke liye tap karein.',
  fDegree: 'Ansh',
  fRashi: 'Rashi',
  fHouse: 'Ghar',
  fNakshatra: 'Nakshatra',
  fDignity: 'Sthiti',
  fLifeAreas: 'Jeevan kshetra',
  fLord: 'Swami',
  fOccupants: 'Sthit grah',
  fAspects: 'Drishti',
  empty: '— khaali —',
  setAsAsc: 'Lagna banayein',
  combust: 'ast',
  retro: 'vakri',
  houseWord: 'Ghar',
  explore: 'Explore shuru karein (what-if)',
  keep: 'Janm kundali banayein',
  discard: 'Explore band karein',
  resetExperiment: 'Experiment reset karein',
  whatIfTitle: 'Kya badla',
  beforeCol: 'Pehle',
  afterCol: 'Ab',
  noChanges: 'Abhi koi badlaav nahi — experiment ke liye grah kheenchein ya lagna badlein.',
  more: 'Yeh reading kyun',
  trayEmpty: 'Saare grah placed hain. Hatane ke liye wapas yahan kheenchein.',
  guideLabel: 'Shuruaat',
  guideStep1: 'Pehle rashiyan set karein — kisi bhi rashi number ko kisi bhi ghar par chhodein; baarahon ghar apne aap bhar jayenge.',
  guideStep2: 'Phir grah rakhein — tray se gharon mein kheenchein. Rahu aur Ketu hamesha saath, 180° par move hote hain.',
  tplLabel: 'Chart style',
  tplClassic: 'Classic',
  tplMidnight: 'Royal',
  tplSand: 'Heritage',
  lgLabel: 'Grah markers',
  lgExalted: 'uchch',
  lgDebilitated: 'neech',
  lgRetro: 'vakri',
  sideInspect: 'Inspect',
  sideReading: 'Phal',
  sideInsights: 'Insights',
  sideOverview: 'Saransh',
  hSupporting: 'Samarthan',
  hAgainst: 'Virodh',
  hConfidence: 'Vishwas',
  hTechnical: 'Technical detail',
  bookOpen: 'Poori reading',
  bookClose: 'Band karein',
  bookCover: 'Ek nazar mein kundali',
  bookIncomplete: 'Poori book ke liye 9 grah rakhein — khule sections ab tak ka gyaat dikhate hain.',
  bookMethod: 'Ise kaise padhein',
  methodNotes: [
    'Grah sthitiyan gini jaati hain, andazi nahi — har sankhya ephemeris ya aapke input se aati hai.',
    'Score jhukaav dikhata hai, nishchay nahi — 72 ka matlab 72% chance nahi.',
    'Ghar whole-sign hain: ek rashi, ek ghar.',
    'Timing ke liye janm tithi-samay chahiye; bina iske timing lines shaant rehti hain.',
  ],
  tagline: 'Drag • Explore • Understand',
  themeToggle: 'Dark theme badlein',
  howItWorks: 'Yeh kaise kaam karta hai?',
  howTitle: 'Kundali ke saath khelkar seekhein',
  howSteps: [
    'Pehle rashiyan set karein — koi bhi rashi, kisi bhi ghar par.',
    'Grahon ko left se gharon mein kheenchein.',
    'Dekhne ke liye ghar ya grah par click karein.',
    'Placement badlein aur har reading ko update hote dekhein.',
  ],
  instrLine1: 'Pehle rashiyan set karein — kisi bhi rashi number ko kisi bhi ghar par chhodein; baarahon ghar apne aap bhar jayenge.',
  instrLine2: 'Phir grah rakhein — left se gharon mein kheenchein. Rahu aur Ketu hamesha saath, 180° par move hote hain.',
  instrClose: 'Instructions chhupayein',
  allCats: 'Sabhi',
  inPhysical: 'Physical Energy',
  inMental: 'Mental Strength',
  inComplete: 'Chart poornata',
  inPlanetCov: 'Grah coverage',
  inHouseCov: 'Ghar coverage',
  inStrongest: 'Sabse majboot kshetra',
  inWeakest: 'Sabse kamzor kshetra',
  inDignity: 'Grah sthiti',
  inRetro: 'Vakri grah',
  inExalted: 'Uchch grah',
  inDebilitated: 'Neech grah',
  inNeedMore: 'Aur grah jodein',
  inYogas: 'Shastriya yog',
  bdTitle: 'Janm vivaran',
  bdName: 'Naam',
  bdPlace: 'Janm sthan',
  bdDate: 'Janm tithi aur samay',
  bdCity: 'Sheher',
  bdCustom: 'Custom nirdeshank',
  bdLat: 'Akshansh',
  bdLon: 'Deshantar',
  bdSubmit: 'Meri kundali banayein',
  bdInvalid: 'Tithi, samay aur nirdeshank jaanchein.',
  bdNote: 'Sthaniya janm samay likhein; device timezone se badla jayega.',
  locPlaceholder: 'Sheher, gaon, zila — ya 6 ank ka pincode',
  locDontKnow: "Placement nahi pata?",
  calPlaceholder: 'Tithi aur samay chunein',
  calApply: 'Lagoo karein',
  calClear: 'Saaf karein',
  calToday: 'Aaj',
  calPickHint: 'Mahina aur saal chunne ke liye title par tap karein',
  calTime: 'Samay',
  calHour: 'Ghanta',
  calMinute: 'Minute',
  calDone: 'Ho gaya',
  locHint: 'Gaon aur videshi sthan map directory se load hote hain.',
  pinHint: 'Pincode pehchana gaya — uska kshetra nikala ja raha hai.',
  locNone: 'Koi match nahi. Paas ka kasba ya pincode try karein.',
  locApprox: 'lagbhag',
  locClear: 'Sthan hatayein',
  inOverall: 'Kul sanket',
  inTimingNow: 'Ab ka samay',
  inSadeSati: 'Sade-sati',
  inActiveNow: 'Ab sakriya vishay',
  inOpposite: 'Viprit ghar',
  inRelated: 'Sambandhit ghar',
  domainName: {
    career: 'Career', money: 'Dhan', marriage: 'Vivah', relationships: 'Rishte',
    education: 'Padhai', family: 'Parivar', property: 'Sampatti', children: 'Santaan',
    health: 'Swasthya', spirituality: 'Adhyatm', personality: 'Vyaktitva', general: 'Samanya',
  },
  views: {
    D1: {
      label: 'D1 · Janm',
      tagline: 'Mukhya jeevan kundali',
      about:
        'Janm kundali. Har jeevan-kshetra — swasthya, dhan, vivah, career — apne ghar se padha jaata hai, lagna se ginkar. Ghar whole-sign hain: ek rashi, ek ghar.',
    },
    CHANDRA: {
      label: 'Chandra Lagna',
      tagline: 'Chandrama se dekha gaya jeevan',
      about:
        'Vahi grah, ghar lagna ki jagah Chandrama ki rashi se gine jaate hain. Mann, bhavnayein aur aap ghatnaon ko kaise mehsoos karte hain — yeh dikhata hai.',
    },
    D4: {
      label: 'D4 · Chaturthamsha',
      tagline: 'Sampatti aur bhagya',
      about:
        'Har rashi 4 bhaagon mein banti hai. Sampatti, ghar, sthir sampada aur bhagya ke liye ghar yahin se padhein.',
    },
    D6: {
      label: 'D6 · Shashtamsha',
      tagline: 'Swasthya aur badhayein',
      about:
        'Har rashi 6 bhaagon mein banti hai. Swasthya, karz, shatru aur roz ki mushkilon ke liye ghar yahin se padhein.',
    },
    D7: {
      label: 'D7 · Saptamsha',
      tagline: 'Santaan aur rachna',
      about:
        'Har rashi 7 bhaagon mein banti hai. Santaan, vansh aur rachnaatmak fal ke liye ghar yahin se padhein.',
    },
    D9: {
      label: 'D9 · Navamsha',
      tagline: 'Aantrik bal aur dharm',
      about:
        'Har rashi 9 bhaagon mein banti hai. Aantrik bal, paripakvata, vivah aur dharm dikhata hai — D9 mein bali grah apne vaade nibhata hai.',
    },
    D10: {
      label: 'D10 · Dashamsha',
      tagline: 'Career aur pesha',
      about:
        'Har rashi 10 bhaagon mein banti hai. Kaam, pratishtha, adhikaar aur sansarik karm ke liye ghar yahin se padhein.',
    },
    D60: {
      label: 'D60 · Shashtiamsha',
      tagline: 'Pichhle janm ke karm',
      about:
        'Har rashi 60 bhaagon mein banti hai, aadhe degree ke. Sabse sukshm lens — sabke peechhe pichhle janm ke karm. Sateek janm samay chahiye.',
    },
  },
  qaAi: 'AI Reading',
  aiTitle: 'AI Reading',
  aiPrompt: 'Prompt',
  aiCopy: 'Prompt copy karein',
  aiCopied: 'Copy ho gaya!',
  aiGuideTeaser: 'Picture guide ke liye logo dabayein',
  setTitle: 'Settings',
  setProfiles: 'Profiles',
  setAi: 'AI aur Sharing',
  setSaveCurrent: 'Current chart save karein',
  setNamePh: 'Naam, jaise Aarav',
  setLoad: 'Load karein',
  setDelete: 'Hatayein',
  setEmpty: 'Abhi koi profile nahi — upar current chart save karein.',
  setCloud: 'Cloud (MongoDB)',
  setLocal: 'Is device par',
  setOpenPrompt: 'AI reading prompt kholein',
  setMcpUrl: 'MCP server URL',
  setActive: 'Active',
  setConnect: 'Connect karein',
  setConnectHint: 'Personal AI link — AI khud yeh profile khol lega',
  setSelf: 'Khud',
  setMarkSelf: 'Khud set karein',
  setGender: 'Ling',
  setMale: 'Male',
  setFemale: 'Female',
  setOther: 'Other',
  setNewProfile: 'Nayi profile',
  setProfileName: 'Profile naam, jaise Family',
  setCreate: 'Banayein',
  setCopyLink: 'AI link copy karein',
  setResetLink: 'Link reset karein',
  setDownloadCfg: 'Config file download karein',
  toastNoChart: 'Abhi save karne ko kuch nahi — pehle chart banayein.',
  toastNoLink: 'Connect ke liye internet aur database chahiye — phir try karein.',
  toastCopyFail: 'Copy nahi hua — text ko touch-hold karke copy karein.',
  authTitle: 'Aapka account',
  authLogin: 'Log in karein',
  authSignup: 'Naya account',
  authEmail: 'Email',
  authPassword: 'Password (8+ akshar)',
  authGoogle: 'Google se aage badhein',
  authFail: 'Yeh kaam nahi kiya — email aur password jaanchein.',
  authLogout: 'Log out',
  authDob: 'Janm',
  authTob: 'Samay',
  authPob: 'Sthan',
  graha: {
    Sun: 'Surya',
    Moon: 'Chandrama',
    Mars: 'Mangal',
    Mercury: 'Budh',
    Jupiter: 'Guru',
    Venus: 'Shukra',
    Saturn: 'Shani',
    Rahu: 'Rahu',
    Ketu: 'Ketu',
  },
  rashi: [
    'Mesh', 'Vrishabh', 'Mithun', 'Kark', 'Singh', 'Kanya',
    'Tula', 'Vrishchik', 'Dhanu', 'Makar', 'Kumbh', 'Meen',
  ],
  themes: {
    1: ['Swayam', 'Sharir', 'Vyaktitva'],
    2: ['Dhan', 'Vani', 'Parivar'],
    3: ['Sahas', 'Bhai-behen', 'Kaushal'],
    4: ['Ghar', 'Maa', 'Sukh'],
    5: ['Rachnatmakta', 'Santaan', 'Padhai'],
    6: ['Swasthya', 'Seva', 'Pratiyogita'],
    7: ['Vivah', 'Sajhedaari'],
    8: ['Aayu', 'Parivartan'],
    9: ['Dharm', 'Bhagya', 'Guru'],
    10: ['Career', 'Pratishtha', 'Karya'],
    11: ['Laabh', 'Mitra', 'Lakshya'],
    12: ['Kharch', 'Yatra', 'Adhyatm'],
  },
};

const HI: UIStrings = {
  ...EN,
  subtitle: 'ग्रहों और राशियों को खींचकर छोड़ें — हर चीज़ तुरंत दोबारा गणना होती है।',
  trayTitle: 'ग्रह जोड़ें',
  traySub: 'ग्रहों को घरों में खींचें',
  trayHint:
    'सुझाव: किसी भी राशि संख्या को किसी भी घर पर छोड़ें, पूरी कुंडली अपने आप भर जाएगी। बिना ड्रैग के: पहले ग्रह टैप करें, फिर घर टैप करें।',
  panelEmpty: 'किसी ग्रह, राशि या घर पर होवर करें — या चुनने के लिए टैप करें।',
  fDegree: 'अंश',
  fRashi: 'राशि',
  fHouse: 'घर',
  fNakshatra: 'नक्षत्र',
  fDignity: 'स्थिति',
  fLifeAreas: 'जीवन क्षेत्र',
  fLord: 'स्वामी',
  fOccupants: 'स्थित ग्रह',
  fAspects: 'दृष्टि',
  empty: '— खाली —',
  setAsAsc: 'लग्न बनाएं',
  combust: 'अस्त',
  retro: 'वक्री',
  houseWord: 'घर',
  explore: 'एक्सप्लोर शुरू करें',
  keep: 'जन्म कुंडली बनाएं',
  discard: 'एक्सप्लोर बंद करें',
  resetExperiment: 'प्रयोग रीसेट करें',
  whatIfTitle: 'क्या बदला',
  beforeCol: 'पहले',
  afterCol: 'अब',
  noChanges: 'अभी कोई बदलाव नहीं — प्रयोग के लिए ग्रह खींचें या लग्न बदलें।',
  more: 'यह निष्कर्ष क्यों',
  trayEmpty: 'सभी ग्रह रखे गए हैं। हटाने के लिए वापस यहाँ खींचें।',
  guideLabel: 'शुरुआत',
  guideStep1: 'पहले राशियाँ तय करें — किसी भी राशि संख्या को किसी भी घर पर छोड़ें; बारहों घर अपने आप भर जाएंगे।',
  guideStep2: 'फिर ग्रह रखें — ट्रे से घरों में खींचें। राहु और केतु हमेशा साथ, 180° पर चलते हैं।',
  tplLabel: 'चार्ट शैली',
  tplClassic: 'क्लासिक',
  tplMidnight: 'रॉयल',
  tplSand: 'हेरिटेज',
  lgLabel: 'ग्रह चिह्न',
  lgExalted: 'उच्च',
  lgDebilitated: 'नीच',
  lgRetro: 'वक्री',
  sideInspect: 'निरीक्षण',
  sideReading: 'फल',
  sideInsights: 'इनसाइट्स',
  sideOverview: 'सारांश',
  hSupporting: 'समर्थन',
  hAgainst: 'विरोध',
  hConfidence: 'विश्वास',
  hTechnical: 'तकनीकी विवरण',
  bookOpen: 'पूर्ण वाचन',
  bookClose: 'बंद करें',
  bookCover: 'एक नज़र में कुंडली',
  bookIncomplete: 'पूरी पुस्तक के लिए 9 ग्रह रखें — खुले खंड अब तक का ज्ञात दिखाते हैं।',
  bookMethod: 'इसे कैसे पढ़ें',
  methodNotes: [
    'ग्रह स्थितियाँ गिनी जाती हैं, अंदाज़ा नहीं — हर संख्या एफ़ेमेरिस या आपके इनपुट से आती है।',
    'स्कोर झुकाव दिखाता है, निश्चय नहीं — 72 का अर्थ 72% संभावना नहीं।',
    'घर पूर्ण-राशि हैं: एक राशि, एक घर।',
    'समय-गणना के लिए जन्म तिथि-समय चाहिए; बिना इसके समय-पंक्तियाँ मौन रहती हैं।',
  ],
  tagline: 'Drag • Explore • Understand',
  themeToggle: 'डार्क थीम बदलें',
  howItWorks: 'यह कैसे काम करता है?',
  howTitle: 'कुंडली के साथ खेलकर सीखें',
  howSteps: [
    'पहले राशियाँ तय करें — कोई भी राशि, किसी भी घर पर।',
    'ग्रहों को बाएँ से घरों में खींचें।',
    'देखने के लिए घर या ग्रह पर क्लिक करें।',
    'स्थिति बदलें और हर रीडिंग को अपडेट होते देखें।',
  ],
  instrLine1: 'पहले राशियाँ तय करें — किसी भी राशि संख्या को किसी भी घर पर छोड़ें; बारहों घर अपने आप भर जाएंगे।',
  instrLine2: 'फिर ग्रह रखें — बाएँ से घरों में खींचें। राहु और केतु हमेशा साथ, 180° पर चलते हैं।',
  instrClose: 'निर्देश छुपाएँ',
  allCats: 'सभी',
  inPhysical: 'शारीरिक ऊर्जा',
  inMental: 'मानसिक बल',
  inComplete: 'चार्ट पूर्णता',
  inPlanetCov: 'ग्रह कवरेज',
  inHouseCov: 'घर कवरेज',
  inStrongest: 'सबसे मज़बूत क्षेत्र',
  inWeakest: 'सबसे कमज़ोर क्षेत्र',
  inDignity: 'ग्रह स्थिति',
  inRetro: 'वक्री ग्रह',
  inExalted: 'उच्च ग्रह',
  inDebilitated: 'नीच ग्रह',
  inNeedMore: 'और ग्रह जोड़ें',
  inYogas: 'शास्त्रीय योग',
  bdTitle: 'जन्म विवरण',
  bdName: 'नाम',
  bdPlace: 'जन्म स्थान',
  bdDate: 'जन्म तिथि और समय',
  bdCity: 'शहर',
  bdCustom: 'कस्टम निर्देशांक',
  bdLat: 'अक्षांश',
  bdLon: 'देशांतर',
  bdSubmit: 'मेरी कुंडली बनाएँ',
  bdInvalid: 'तिथि, समय और निर्देशांक जाँचें।',
  bdNote: 'स्थानीय जन्म समय लिखें; डिवाइस टाइमज़ोन से बदला जाएगा।',
  locPlaceholder: 'शहर, गाँव, ज़िला — या 6 अंक का पिनकोड',
  locDontKnow: 'प्लेसमेंट नहीं पता?',
  calPlaceholder: 'तिथि और समय चुनें',
  calApply: 'लागू करें',
  calClear: 'साफ़ करें',
  calToday: 'आज',
  calPickHint: 'महीना व साल चुनने के लिए शीर्षक पर टैप करें',
  calTime: 'समय',
  calHour: 'घंटा',
  calMinute: 'मिनट',
  calDone: 'हो गया',
  locHint: 'गाँव और विदेशी स्थान मानचित्र निर्देशिका से लोड होते हैं।',
  pinHint: 'पिनकोड पहचाना गया — उसका क्षेत्र निकाला जा रहा है।',
  locNone: 'कोई मेल नहीं। पास का कस्बा या पिनकोड आज़माएँ।',
  locApprox: 'लगभग',
  locClear: 'स्थान हटाएँ',
  inOverall: 'कुल संकेत',
  inTimingNow: 'वर्तमान समय',
  inSadeSati: 'साढ़ेसाती',
  inActiveNow: 'अभी सक्रिय विषय',
  inOpposite: 'विपरीत घर',
  inRelated: 'संबंधित घर',
  domainName: {
    career: 'करियर', money: 'धन', marriage: 'विवाह', relationships: 'रिश्ते',
    education: 'पढ़ाई', family: 'परिवार', property: 'संपत्ति', children: 'संतान',
    health: 'स्वास्थ्य', spirituality: 'आध्यात्म', personality: 'व्यक्तित्व', general: 'सामान्य',
  },
  views: {
    D1: {
      label: 'D1 · जन्म',
      tagline: 'मुख्य जीवन कुंडली',
      about:
        'जन्म कुंडली। हर जीवन-क्षेत्र — स्वास्थ्य, धन, विवाह, करियर — अपने घर से पढ़ा जाता है, लग्न से गिनकर। घर पूर्ण-राशि हैं: एक राशि, एक घर।',
    },
    CHANDRA: {
      label: 'चंद्र लग्न',
      tagline: 'चंद्रमा से देखा गया जीवन',
      about:
        'वही ग्रह, घर लग्न की जगह चंद्रमा की राशि से गिने जाते हैं। मन, भावनाएं और आप घटनाओं को कैसे महसूस करते हैं — यह दिखाता है।',
    },
    D4: {
      label: 'D4 · चतुर्थांश',
      tagline: 'संपत्ति और भाग्य',
      about:
        'हर राशि 4 भागों में बंटती है। संपत्ति, घर, स्थिर संपदा और भाग्य के लिए घर यहीं से पढ़ें।',
    },
    D6: {
      label: 'D6 · षष्ठांश',
      tagline: 'स्वास्थ्य और बाधाएं',
      about:
        'हर राशि 6 भागों में बंटती है। स्वास्थ्य, कर्ज, शत्रु और रोज़ की मुश्किलों के लिए घर यहीं से पढ़ें।',
    },
    D7: {
      label: 'D7 · सप्तांश',
      tagline: 'संतान और रचना',
      about:
        'हर राशि 7 भागों में बंटती है। संतान, वंश और रचनात्मक फल के लिए घर यहीं से पढ़ें।',
    },
    D9: {
      label: 'D9 · नवांश',
      tagline: 'आंतरिक बल और धर्म',
      about:
        'हर राशि 9 भागों में बंटती है। आंतरिक बल, परिपक्वता, विवाह और धर्म दिखाता है — D9 में बली ग्रह अपने वादे निभाता है।',
    },
    D10: {
      label: 'D10 · दशमांश',
      tagline: 'करियर और पेशा',
      about:
        'हर राशि 10 भागों में बंटती है। कार्य, प्रतिष्ठा, अधिकार और सांसारिक कर्म के लिए घर यहीं से पढ़ें।',
    },
    D60: {
      label: 'D60 · षष्ट्यंश',
      tagline: 'पिछले जन्मों के कर्म',
      about:
        'हर राशि 60 भागों में बंटती है, आधे डिग्री के। सबसे सूक्ष्म लेंस — सबके पीछे पिछले जन्मों के कर्म। सटीक जन्म समय चाहिए।',
    },
  },
  qaAi: 'एआई रीडिंग',
  aiTitle: 'एआई रीडिंग',
  aiPrompt: 'प्रॉम्प्ट',
  aiCopy: 'प्रॉम्प्ट कॉपी करें',
  aiCopied: 'कॉपी हो गया!',
  aiGuideTeaser: 'चित्र गाइड के लिए लोगो दबाएँ',
  setTitle: 'सेटिंग्स',
  setProfiles: 'प्रोफाइल',
  setAi: 'एआई और शेयरिंग',
  setSaveCurrent: 'वर्तमान कुंडली सहेजें',
  setNamePh: 'नाम, जैसे आरव',
  setLoad: 'लोड करें',
  setDelete: 'हटाएं',
  setEmpty: 'अभी कोई प्रोफाइल नहीं — ऊपर वर्तमान कुंडली सहेजें।',
  setCloud: 'क्लाउड (MongoDB)',
  setLocal: 'इस डिवाइस पर',
  setOpenPrompt: 'एआई रीडिंग प्रॉम्प्ट खोलें',
  setMcpUrl: 'एमसीपी सर्वर यूआरएल',
  setActive: 'सक्रिय',
  setConnect: 'कनेक्ट करें',
  setConnectHint: 'व्यक्तिगत एआई लिंक — एआई स्वयं यह प्रोफाइल खोल लेगा',
  setSelf: 'स्वयं',
  setMarkSelf: 'स्वयं सेट करें',
  setGender: 'लिंग',
  setMale: 'पुरुष',
  setFemale: 'महिला',
  setOther: 'अन्य',
  setNewProfile: 'नई प्रोफाइल',
  setProfileName: 'प्रोफाइल नाम, जैसे Family',
  setCreate: 'बनाएं',
  setCopyLink: 'एआई लिंक कॉपी करें',
  setResetLink: 'लिंक रीसेट करें',
  setDownloadCfg: 'कॉन्फ़िग फ़ाइल डाउनलोड करें',
  toastNoChart: 'अभी सहेजने को कुछ नहीं — पहले कुंडली बनाएँ।',
  toastNoLink: 'कनेक्ट के लिए इंटरनेट और डेटाबेस चाहिए — पुनः प्रयास करें।',
  toastCopyFail: 'कॉपी नहीं हुआ — टेक्स्ट को दबाकर कॉपी करें।',
  authTitle: 'आपका खाता',
  authLogin: 'लॉग इन करें',
  authSignup: 'नया खाता',
  authEmail: 'ईमेल',
  authPassword: 'पासवर्ड (8+ अक्षर)',
  authGoogle: 'Google से आगे बढ़ें',
  authFail: 'यह काम नहीं किया — ईमेल और पासवर्ड जाँचें।',
  authLogout: 'लॉग आउट',
  authDob: 'जन्म',
  authTob: 'समय',
  authPob: 'स्थान',
  graha: {
    Sun: 'सूर्य',
    Moon: 'चंद्रमा',
    Mars: 'मंगल',
    Mercury: 'बुध',
    Jupiter: 'गुरु',
    Venus: 'शुक्र',
    Saturn: 'शनि',
    Rahu: 'राहु',
    Ketu: 'केतु',
  },
  rashi: [
    'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
    'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन',
  ],
  nakshatra: [
    'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा',
    'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वाफाल्गुनी',
    'उत्तराफाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा',
    'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण',
    'धनिष्ठा', 'शतभिषा', 'पूर्वभाद्रपद', 'उत्तरभाद्रपद', 'रेवती',
  ],
  themes: {
    1: ['स्वयं', 'शरीर', 'व्यक्तित्व'],
    2: ['धन', 'वाणी', 'परिवार'],
    3: ['साहस', 'भाई-बहन', 'कौशल'],
    4: ['घर', 'माँ', 'सुख'],
    5: ['रचनात्मकता', 'संतान', 'पढ़ाई'],
    6: ['स्वास्थ्य', 'सेवा', 'प्रतियोगिता'],
    7: ['विवाह', 'साझेदारी'],
    8: ['आयु', 'परिवर्तन'],
    9: ['धर्म', 'भाग्य', 'गुरु'],
    10: ['करियर', 'प्रतिष्ठा', 'कार्य'],
    11: ['लाभ', 'मित्र', 'लक्ष्य'],
    12: ['खर्च', 'यात्रा', 'आध्यात्म'],
  },
};

export const STRINGS: Record<Lang, UIStrings> = { en: EN, hinglish: HINGLISH, hi: HI };

export const LANG_OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'English' },
  { lang: 'hinglish', label: 'Hinglish' },
  { lang: 'hi', label: 'हिन्दी' },
];
