// Domain definitions: DATA, not logic. Each domain declares what matters
// (houses, planets, lords, vargas, yogas, timing) and which rule
// configurations count for and against it. The evaluator lives in
// domain-engine.ts; nothing here executes. Strengths are capped modestly —
// no single placement decides a domain.

import type { Bhava, ConfirmationReq, Graha, TimingSystem, TopicId, Varga } from './types';

export type RuleKind =
  | 'lord-dignity'
  | 'graha-dignity'
  | 'occupant'
  | 'aspect-house'
  | 'aspect-lord'
  | 'affliction'
  | 'varga-dignity'
  | 'yoga';

export interface RuleDef {
  ruleId: string;
  kind: RuleKind;
  house?: Bhava;
  graha?: Graha;
  grahas?: Graha[];
  by?: Graha;
  targetHouse?: Bhava;
  varga?: Varga;
  /** Yoga name for kind 'yoga'. */
  yoga?: string;
  when: 'strong' | 'weak' | 'present';
  strength: number; // 0–1 cap for this rule
  relevance: number; // 0–1 centrality to the domain
  /** Templates: {lord} {dignity} {graha} {house} {varga} {with}. States facts, not fate. */
  reason: string;
}

export interface DomainDef {
  domain: TopicId;
  label: string;
  houses: Bhava[];
  planets: Graha[];
  lordsOf: Bhava[];
  vargas: Varga[];
  /** Classical yogas worth checking once the yoga engine exists. Metadata for now. */
  yogas: string[];
  timing: TimingSystem[];
  confirm: ConfirmationReq;
  positive: RuleDef[];
  negative: RuleDef[];
}

const STD_CONFIRM: ConfirmationReq = { minFacts: 2, highScoreThreshold: 75, highScoreNeedsConfirm: true };

export const DOMAIN_DEFS: Record<TopicId, DomainDef> = {
  career: {
    domain: 'career', label: 'Career',
    houses: [10, 1, 6, 11], planets: ['Saturn', 'Jupiter', 'Sun', 'Mars'], lordsOf: [10, 1],
    vargas: ['D1', 'D10', 'D9'], yogas: ['Dharmakarmadhipati', 'Amala', 'Budha-Aditya'],
    timing: ['vimshottari', 'transit'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'tenth-lord', kind: 'lord-dignity', house: 10, when: 'strong', strength: 0.8, relevance: 1, reason: 'Career (10th) lord {lord} is {dignity} — able to deliver' },
      { ruleId: 'saturn-tenth', kind: 'occupant', house: 10, grahas: ['Saturn'], when: 'present', strength: 0.55, relevance: 0.6, reason: 'Saturn touches the 10th — steady effort is rewarded over time' },
      { ruleId: 'jupiter-tenth', kind: 'aspect-house', house: 10, by: 'Jupiter', when: 'present', strength: 0.6, relevance: 0.7, reason: 'Jupiter aspects the 10th — guidance and goodwill at work' },
      { ruleId: 'jupiter-tenth-lord', kind: 'aspect-lord', targetHouse: 10, by: 'Jupiter', when: 'present', strength: 0.5, relevance: 0.6, reason: 'Jupiter aspects the career lord {lord} — mentors open doors' },
      { ruleId: 'sun-tenth', kind: 'occupant', house: 10, grahas: ['Sun'], when: 'present', strength: 0.5, relevance: 0.5, reason: 'Sun in the 10th — visibility and authority in career' },
      { ruleId: 'd10-confirm', kind: 'varga-dignity', house: 10, varga: 'D10', when: 'strong', strength: 0.45, relevance: 0.7, reason: '{lord} is also strong in D10 — professional promise holds under scrutiny' },
      { ruleId: 'd9-confirm', kind: 'varga-dignity', house: 10, varga: 'D9', when: 'strong', strength: 0.4, relevance: 0.6, reason: '{lord} is also strong in D9 — career promise deepens with maturity' },
      { ruleId: 'yoga-dk', kind: 'yoga', yoga: 'Dharmakarmadhipati', when: 'present', strength: 0.6, relevance: 0.7, reason: 'Dharmakarmadhipati forms — duty and career pull in the same direction' },
      { ruleId: 'yoga-amala', kind: 'yoga', yoga: 'Amala', when: 'present', strength: 0.5, relevance: 0.6, reason: 'Amala forms — a clean reputation supports the career' },
      { ruleId: 'yoga-ba', kind: 'yoga', yoga: 'Budha-Aditya', when: 'present', strength: 0.4, relevance: 0.5, reason: 'Budha-Aditya forms — intellect backs professional standing' },
    ],
    negative: [
      { ruleId: 'tenth-lord', kind: 'lord-dignity', house: 10, when: 'weak', strength: 0.7, relevance: 1, reason: 'Career (10th) lord {lord} is {dignity} — struggles to deliver' },
      { ruleId: 'nodes-tenth', kind: 'occupant', house: 10, grahas: ['Rahu', 'Ketu'], when: 'present', strength: 0.45, relevance: 0.5, reason: '{graha} in the 10th — unconventional path with disruptions' },
      { ruleId: 'd10-confirm', kind: 'varga-dignity', house: 10, varga: 'D10', when: 'weak', strength: 0.4, relevance: 0.7, reason: '{lord} weakens in D10 — early career promise needs sustained effort' },
    ],
  },
  money: {
    domain: 'money', label: 'Wealth',
    houses: [2, 11, 9, 5], planets: ['Jupiter', 'Venus', 'Moon'], lordsOf: [2, 11],
    vargas: ['D1', 'D9'], yogas: ['Dhana', 'Lakshmi'],
    timing: ['vimshottari'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'second-lord', kind: 'lord-dignity', house: 2, when: 'strong', strength: 0.8, relevance: 1, reason: 'Wealth (2nd) lord {lord} is {dignity} — able to deliver' },
      { ruleId: 'benefics-second', kind: 'occupant', house: 2, grahas: ['Jupiter', 'Venus'], when: 'present', strength: 0.5, relevance: 0.6, reason: '{graha} in the 2nd — natural support for savings' },
      { ruleId: 'benefics-gains', kind: 'occupant', house: 11, grahas: ['Jupiter', 'Venus', 'Moon'], when: 'present', strength: 0.45, relevance: 0.5, reason: '{graha} in the 11th — supports income and gains' },
      { ruleId: 'eleventh-lord', kind: 'lord-dignity', house: 11, when: 'strong', strength: 0.6, relevance: 0.7, reason: 'Gains (11th) lord {lord} is {dignity} — supports income' },
      { ruleId: 'd9-confirm', kind: 'varga-dignity', house: 2, varga: 'D9', when: 'strong', strength: 0.45, relevance: 0.7, reason: '{lord} is also strong in D9 — wealth promise deepens with maturity' },
      { ruleId: 'yoga-dhana', kind: 'yoga', yoga: 'Dhana', when: 'present', strength: 0.6, relevance: 0.7, reason: 'Dhana forms — a classical wealth combination is present' },
      { ruleId: 'yoga-lakshmi', kind: 'yoga', yoga: 'Lakshmi', when: 'present', strength: 0.55, relevance: 0.6, reason: 'Lakshmi forms — fortune supports accumulation' },
    ],
    negative: [
      { ruleId: 'second-lord', kind: 'lord-dignity', house: 2, when: 'weak', strength: 0.7, relevance: 1, reason: 'Wealth (2nd) lord {lord} is {dignity} — struggles to deliver' },
      { ruleId: 'malefics-second', kind: 'occupant', house: 2, grahas: ['Saturn', 'Rahu', 'Mars', 'Ketu'], when: 'present', strength: 0.5, relevance: 0.6, reason: '{graha} in the 2nd — drains or delays accumulation' },
      { ruleId: 'd9-confirm', kind: 'varga-dignity', house: 2, varga: 'D9', when: 'weak', strength: 0.4, relevance: 0.7, reason: '{lord} weakens in D9 — early wealth promise needs sustained effort' },
    ],
  },
  marriage: {
    domain: 'marriage', label: 'Marriage',
    houses: [7, 2, 8, 5], planets: ['Venus', 'Jupiter', 'Moon'], lordsOf: [7],
    vargas: ['D1', 'D9'], yogas: [],
    timing: ['vimshottari', 'transit'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'venus-strength', kind: 'graha-dignity', graha: 'Venus', when: 'strong', strength: 0.75, relevance: 1, reason: 'Venus is {dignity} — supports harmony in partnership' },
      { ruleId: 'seventh-lord', kind: 'lord-dignity', house: 7, when: 'strong', strength: 0.7, relevance: 0.8, reason: 'Partnership (7th) lord {lord} is {dignity} — able to deliver' },
      { ruleId: 'benefics-seventh', kind: 'occupant', house: 7, grahas: ['Jupiter', 'Venus', 'Moon'], when: 'present', strength: 0.45, relevance: 0.5, reason: '{graha} in the 7th — warmth in partnership' },
      { ruleId: 'd9-confirm', kind: 'varga-dignity', house: 7, varga: 'D9', when: 'strong', strength: 0.45, relevance: 0.7, reason: '{lord} is also strong in D9 — partnership promise deepens with maturity' },
    ],
    negative: [
      { ruleId: 'venus-strength', kind: 'graha-dignity', graha: 'Venus', when: 'weak', strength: 0.7, relevance: 1, reason: 'Venus is {dignity} — partnership needs conscious work' },
      { ruleId: 'seventh-afflicted', kind: 'occupant', house: 7, grahas: ['Saturn', 'Rahu', 'Mars', 'Ketu'], when: 'present', strength: 0.55, relevance: 0.7, reason: '{graha} in the 7th — friction or delay in partnership' },
      { ruleId: 'seventh-lord', kind: 'lord-dignity', house: 7, when: 'weak', strength: 0.6, relevance: 0.8, reason: 'Partnership (7th) lord {lord} is {dignity} — struggles to deliver' },
      { ruleId: 'd9-confirm', kind: 'varga-dignity', house: 7, varga: 'D9', when: 'weak', strength: 0.4, relevance: 0.7, reason: '{lord} weakens in D9 — early partnership promise needs sustained effort' },
    ],
  },
  relationships: {
    domain: 'relationships', label: 'Relationships',
    houses: [7, 3, 11, 5], planets: ['Venus', 'Moon', 'Mercury'], lordsOf: [7, 11],
    vargas: ['D1', 'D9'], yogas: [],
    timing: ['vimshottari'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'venus-strength', kind: 'graha-dignity', graha: 'Venus', when: 'strong', strength: 0.7, relevance: 0.9, reason: 'Venus is {dignity} — ease in relating to others' },
      { ruleId: 'moon-strength', kind: 'graha-dignity', graha: 'Moon', when: 'strong', strength: 0.55, relevance: 0.7, reason: 'Moon is {dignity} — emotional availability in bonds' },
      { ruleId: 'eleventh-lord', kind: 'lord-dignity', house: 11, when: 'strong', strength: 0.6, relevance: 0.7, reason: 'Friendships (11th) lord {lord} is {dignity} — supportive circle' },
      { ruleId: 'benefics-gains', kind: 'occupant', house: 11, grahas: ['Venus', 'Jupiter'], when: 'present', strength: 0.45, relevance: 0.5, reason: '{graha} in the 11th — goodwill from friends' },
    ],
    negative: [
      { ruleId: 'venus-strength', kind: 'graha-dignity', graha: 'Venus', when: 'weak', strength: 0.65, relevance: 0.9, reason: 'Venus is {dignity} — relating takes conscious work' },
      { ruleId: 'moon-afflicted', kind: 'affliction', graha: 'Moon', when: 'present', strength: 0.55, relevance: 0.7, reason: 'Moon is afflicted{with} — mood swings strain bonds' },
      { ruleId: 'seventh-afflicted', kind: 'occupant', house: 7, grahas: ['Saturn', 'Rahu', 'Mars', 'Ketu'], when: 'present', strength: 0.5, relevance: 0.6, reason: '{graha} in the 7th — friction in close bonds' },
      { ruleId: 'eleventh-lord', kind: 'lord-dignity', house: 11, when: 'weak', strength: 0.55, relevance: 0.7, reason: 'Friendships (11th) lord {lord} is {dignity} — circle needs care' },
    ],
  },
  education: {
    domain: 'education', label: 'Education',
    houses: [4, 5, 2, 9], planets: ['Mercury', 'Jupiter', 'Moon'], lordsOf: [4, 5],
    vargas: ['D1', 'D9'], yogas: ['Saraswati', 'Budha-Aditya'],
    timing: ['vimshottari'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'study-lords', kind: 'graha-dignity', graha: 'Mercury', when: 'strong', strength: 0.6, relevance: 0.9, reason: 'Mercury is {dignity} — strong grasp and memory' },
      { ruleId: 'study-lords', kind: 'graha-dignity', graha: 'Jupiter', when: 'strong', strength: 0.6, relevance: 0.9, reason: 'Jupiter is {dignity} — wisdom and good guidance' },
      { ruleId: 'fourth-lord', kind: 'lord-dignity', house: 4, when: 'strong', strength: 0.7, relevance: 0.8, reason: 'Learning base (4th) lord {lord} is {dignity} — steady foundation' },
      { ruleId: 'fifth-lord', kind: 'lord-dignity', house: 5, when: 'strong', strength: 0.65, relevance: 0.7, reason: 'Intellect (5th) lord {lord} is {dignity} — supports study' },
      { ruleId: 'study-houses', kind: 'occupant', house: 4, grahas: ['Mercury', 'Jupiter'], when: 'present', strength: 0.4, relevance: 0.5, reason: '{graha} in the 4th — learning environment supports study' },
      { ruleId: 'study-houses', kind: 'occupant', house: 5, grahas: ['Mercury', 'Jupiter'], when: 'present', strength: 0.4, relevance: 0.5, reason: '{graha} in the 5th — learning environment supports study' },
      { ruleId: 'yoga-saraswati', kind: 'yoga', yoga: 'Saraswati', when: 'present', strength: 0.6, relevance: 0.7, reason: 'Saraswati forms — the significators of learning stand together in strength' },
      { ruleId: 'yoga-ba', kind: 'yoga', yoga: 'Budha-Aditya', when: 'present', strength: 0.4, relevance: 0.5, reason: 'Budha-Aditya forms — sharp intellect supports study' },
    ],
    negative: [
      { ruleId: 'fourth-lord', kind: 'lord-dignity', house: 4, when: 'weak', strength: 0.6, relevance: 0.8, reason: 'Learning base (4th) lord {lord} is {dignity} — foundation needs shoring up' },
      { ruleId: 'mercury-afflicted', kind: 'affliction', graha: 'Mercury', when: 'present', strength: 0.5, relevance: 0.6, reason: 'Mercury is afflicted{with} — concentration wavers under pressure' },
      { ruleId: 'study-lords', kind: 'graha-dignity', graha: 'Mercury', when: 'weak', strength: 0.55, relevance: 0.8, reason: 'Mercury is {dignity} — rote learning works better than speed' },
    ],
  },
  family: {
    domain: 'family', label: 'Family',
    houses: [2, 4], planets: ['Moon', 'Venus', 'Jupiter'], lordsOf: [2, 4],
    vargas: ['D1', 'D9'], yogas: [],
    timing: ['vimshottari'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'second-lord', kind: 'lord-dignity', house: 2, when: 'strong', strength: 0.75, relevance: 0.9, reason: 'Family (2nd) lord {lord} is {dignity} — able to deliver' },
      { ruleId: 'fourth-lord', kind: 'lord-dignity', house: 4, when: 'strong', strength: 0.7, relevance: 0.8, reason: 'Home (4th) lord {lord} is {dignity} — steady foundation' },
      { ruleId: 'moon-strength', kind: 'graha-dignity', graha: 'Moon', when: 'strong', strength: 0.55, relevance: 0.7, reason: 'Moon is {dignity} — emotional security at home' },
      { ruleId: 'benefics-fourth', kind: 'occupant', house: 4, grahas: ['Moon', 'Venus', 'Jupiter'], when: 'present', strength: 0.45, relevance: 0.5, reason: '{graha} in the 4th — warmth in the home' },
    ],
    negative: [
      { ruleId: 'second-lord', kind: 'lord-dignity', house: 2, when: 'weak', strength: 0.65, relevance: 0.9, reason: 'Family (2nd) lord {lord} is {dignity} — needs conscious care' },
      { ruleId: 'fourth-afflicted', kind: 'occupant', house: 4, grahas: ['Saturn', 'Rahu', 'Mars', 'Ketu'], when: 'present', strength: 0.5, relevance: 0.6, reason: '{graha} in the 4th — heaviness around home matters' },
      { ruleId: 'moon-afflicted', kind: 'affliction', graha: 'Moon', when: 'present', strength: 0.55, relevance: 0.7, reason: 'Moon is afflicted{with} — rest and reassurance matter more' },
    ],
  },
  property: {
    domain: 'property', label: 'Property',
    houses: [4, 1, 10], planets: ['Mars', 'Saturn', 'Venus', 'Moon'], lordsOf: [4],
    vargas: ['D1', 'D9'], yogas: [],
    timing: ['vimshottari', 'transit'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'fourth-lord', kind: 'lord-dignity', house: 4, when: 'strong', strength: 0.8, relevance: 1, reason: 'Property (4th) lord {lord} is {dignity} — able to deliver' },
      { ruleId: 'mars-strength', kind: 'graha-dignity', graha: 'Mars', when: 'strong', strength: 0.55, relevance: 0.7, reason: 'Mars is {dignity} — drive to acquire land and assets' },
      { ruleId: 'benefics-fourth', kind: 'occupant', house: 4, grahas: ['Mars', 'Venus'], when: 'present', strength: 0.5, relevance: 0.5, reason: '{graha} in the 4th — supports acquiring property' },
      { ruleId: 'moon-fourth', kind: 'occupant', house: 4, grahas: ['Moon'], when: 'present', strength: 0.4, relevance: 0.4, reason: 'Moon in the 4th — comfort in owned spaces' },
    ],
    negative: [
      { ruleId: 'fourth-lord', kind: 'lord-dignity', house: 4, when: 'weak', strength: 0.7, relevance: 1, reason: 'Property (4th) lord {lord} is {dignity} — delays likely, verify titles twice' },
      { ruleId: 'fourth-afflicted', kind: 'occupant', house: 4, grahas: ['Saturn', 'Rahu'], when: 'present', strength: 0.5, relevance: 0.6, reason: '{graha} in the 4th — disputes or delays around property' },
      { ruleId: 'mars-afflicted', kind: 'affliction', graha: 'Mars', when: 'present', strength: 0.45, relevance: 0.5, reason: 'Mars is afflicted{with} — haste in deals backfires' },
    ],
  },
  children: {
    domain: 'children', label: 'Children',
    houses: [5, 2, 9], planets: ['Jupiter', 'Venus', 'Moon'], lordsOf: [5],
    vargas: ['D1', 'D9'], yogas: [],
    timing: ['vimshottari'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'fifth-lord', kind: 'lord-dignity', house: 5, when: 'strong', strength: 0.8, relevance: 1, reason: 'Children (5th) lord {lord} is {dignity} — able to deliver' },
      { ruleId: 'jupiter-strength', kind: 'graha-dignity', graha: 'Jupiter', when: 'strong', strength: 0.6, relevance: 0.8, reason: 'Jupiter is {dignity} — natural significator of children supports' },
      { ruleId: 'benefics-fifth', kind: 'occupant', house: 5, grahas: ['Jupiter', 'Venus'], when: 'present', strength: 0.5, relevance: 0.5, reason: '{graha} in the 5th — joy through children' },
    ],
    negative: [
      { ruleId: 'fifth-lord', kind: 'lord-dignity', house: 5, when: 'weak', strength: 0.7, relevance: 1, reason: 'Children (5th) lord {lord} is {dignity} — patience and care needed' },
      { ruleId: 'fifth-afflicted', kind: 'occupant', house: 5, grahas: ['Saturn', 'Rahu', 'Mars', 'Ketu'], when: 'present', strength: 0.55, relevance: 0.6, reason: '{graha} in the 5th — delays or anxiety around children' },
      { ruleId: 'jupiter-afflicted', kind: 'affliction', graha: 'Jupiter', when: 'present', strength: 0.5, relevance: 0.6, reason: 'Jupiter is afflicted{with} — guidance matters more than timing' },
    ],
  },
  health: {
    domain: 'health', label: 'Health',
    houses: [1, 6, 8], planets: ['Moon', 'Sun', 'Jupiter', 'Saturn'], lordsOf: [1, 6],
    vargas: ['D1'], yogas: [],
    timing: ['vimshottari', 'sade-sati'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'lagna-lord', kind: 'lord-dignity', house: 1, when: 'strong', strength: 0.8, relevance: 1, reason: 'Self (1st) lord {lord} is {dignity} — vitality to recover' },
      { ruleId: 'jupiter-lagna', kind: 'aspect-house', house: 1, by: 'Jupiter', when: 'present', strength: 0.55, relevance: 0.6, reason: 'Jupiter aspects the ascendant — natural recovery and protection' },
      { ruleId: 'sixth-lord-weak', kind: 'lord-dignity', house: 6, when: 'weak', strength: 0.45, relevance: 0.5, reason: 'Disease (6th) lord {lord} is {dignity} — fewer ailments to fight' },
    ],
    negative: [
      { ruleId: 'lagna-lord', kind: 'lord-dignity', house: 1, when: 'weak', strength: 0.75, relevance: 1, reason: 'Self (1st) lord {lord} is {dignity} — guard energy and rest' },
      { ruleId: 'moon-afflicted', kind: 'affliction', graha: 'Moon', when: 'present', strength: 0.65, relevance: 0.8, reason: 'Moon is afflicted{with} — mind and rest need protection' },
      { ruleId: 'lagna-afflicted', kind: 'occupant', house: 1, grahas: ['Saturn', 'Rahu', 'Mars'], when: 'present', strength: 0.5, relevance: 0.6, reason: '{graha} in the 1st — vitality needs guarding' },
    ],
  },
  spirituality: {
    domain: 'spirituality', label: 'Spirituality',
    houses: [9, 12, 5, 8], planets: ['Jupiter', 'Ketu', 'Saturn', 'Moon'], lordsOf: [9, 12],
    vargas: ['D1', 'D9'], yogas: [],
    timing: ['vimshottari'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'ninth-lord', kind: 'lord-dignity', house: 9, when: 'strong', strength: 0.75, relevance: 1, reason: 'Dharma (9th) lord {lord} is {dignity} — pull toward meaning' },
      { ruleId: 'ketu-houses', kind: 'occupant', house: 9, grahas: ['Ketu'], when: 'present', strength: 0.5, relevance: 0.6, reason: 'Ketu in the 9th — detachment that deepens inquiry' },
      { ruleId: 'ketu-houses', kind: 'occupant', house: 12, grahas: ['Ketu'], when: 'present', strength: 0.5, relevance: 0.6, reason: 'Ketu in the 12th — inward turn, liberation themes' },
      { ruleId: 'jupiter-strength', kind: 'graha-dignity', graha: 'Jupiter', when: 'strong', strength: 0.6, relevance: 0.7, reason: 'Jupiter is {dignity} — living wisdom tradition' },
      { ruleId: 'jupiter-twelfth', kind: 'occupant', house: 12, grahas: ['Jupiter'], when: 'present', strength: 0.45, relevance: 0.5, reason: 'Jupiter in the 12th — protected inner life' },
    ],
    negative: [
      { ruleId: 'ninth-lord', kind: 'lord-dignity', house: 9, when: 'weak', strength: 0.65, relevance: 1, reason: 'Dharma (9th) lord {lord} is {dignity} — faith is tested before it settles' },
      { ruleId: 'moon-afflicted', kind: 'affliction', graha: 'Moon', when: 'present', strength: 0.5, relevance: 0.6, reason: 'Moon is afflicted{with} — restless mind resists stillness' },
      { ruleId: 'rahu-ninth', kind: 'occupant', house: 9, grahas: ['Rahu'], when: 'present', strength: 0.45, relevance: 0.5, reason: 'Rahu in the 9th — unorthodox questions before settled belief' },
    ],
  },
  personality: {
    domain: 'personality', label: 'Personality',
    houses: [1, 3, 5], planets: ['Sun', 'Moon', 'Mars', 'Mercury'], lordsOf: [1],
    vargas: ['D1'], yogas: [],
    timing: ['vimshottari'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'lagna-lord', kind: 'lord-dignity', house: 1, when: 'strong', strength: 0.8, relevance: 1, reason: 'Self (1st) lord {lord} is {dignity} — coherent sense of self' },
      { ruleId: 'sun-strength', kind: 'graha-dignity', graha: 'Sun', when: 'strong', strength: 0.6, relevance: 0.7, reason: 'Sun is {dignity} — clear will and direction' },
      { ruleId: 'moon-strength', kind: 'graha-dignity', graha: 'Moon', when: 'strong', strength: 0.55, relevance: 0.7, reason: 'Moon is {dignity} — steady emotional base' },
      { ruleId: 'benefics-lagna', kind: 'occupant', house: 1, grahas: ['Sun', 'Mars', 'Mercury', 'Jupiter'], when: 'present', strength: 0.45, relevance: 0.5, reason: '{graha} in the 1st — colours the outward manner' },
    ],
    negative: [
      { ruleId: 'lagna-lord', kind: 'lord-dignity', house: 1, when: 'weak', strength: 0.75, relevance: 1, reason: 'Self (1st) lord {lord} is {dignity} — identity still forming' },
      { ruleId: 'moon-afflicted', kind: 'affliction', graha: 'Moon', when: 'present', strength: 0.5, relevance: 0.6, reason: 'Moon is afflicted{with} — moods colour self-expression' },
      { ruleId: 'lagna-afflicted', kind: 'occupant', house: 1, grahas: ['Saturn', 'Rahu'], when: 'present', strength: 0.5, relevance: 0.6, reason: '{graha} in the 1st — reserved or guarded manner' },
    ],
  },
  general: {
    domain: 'general', label: 'General vitality',
    houses: [1, 9], planets: ['Sun', 'Moon', 'Jupiter'], lordsOf: [1],
    vargas: ['D1'], yogas: [],
    timing: ['vimshottari'], confirm: STD_CONFIRM,
    positive: [
      { ruleId: 'lagna-lord', kind: 'lord-dignity', house: 1, when: 'strong', strength: 0.8, relevance: 1, reason: 'Self (1st) lord {lord} is {dignity} — overall resilience' },
    ],
    negative: [
      { ruleId: 'lagna-lord', kind: 'lord-dignity', house: 1, when: 'weak', strength: 0.75, relevance: 1, reason: 'Self (1st) lord {lord} is {dignity} — conserve energy' },
    ],
  },
};
