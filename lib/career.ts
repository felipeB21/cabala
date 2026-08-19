export const STARTING_OVR = 60;
export const MIN_OVR = 40;
export const MAX_OVR = 99;
export const SEASON_LENGTH = 2;

export const STARTING_AGE = 17;
export const AGE_STEP = 2;
export const RETIREMENT_AGE = 32;

export type CareerPosition =
  | "goalkeeper"
  | "defender"
  | "midfielder"
  | "forward";

export type ClubTier = "strong" | "mid" | "weak";
export type ClubResult = "win" | "draw" | "loss";

// Player attributes — OVR is derived from these (see computeOvr), never
// tracked as its own independent value, so it can't drift out of sync with
// what the player actually built.
export type CareerAttribute =
  | "pace"
  | "shooting"
  | "passing"
  | "defending"
  | "physical";

export const ATTRIBUTE_KEYS: CareerAttribute[] = [
  "pace",
  "shooting",
  "passing",
  "defending",
  "physical",
];

export type CareerAttributes = Record<CareerAttribute, number>;

export function createStartingAttributes(): CareerAttributes {
  return {
    pace: STARTING_OVR,
    shooting: STARTING_OVR,
    passing: STARTING_OVR,
    defending: STARTING_OVR,
    physical: STARTING_OVR,
  };
}

// Weights sum to 1 per position — used only to derive the single OVR number
// for display/sorting/starter-probability, not for growth (see the
// primary/secondary groups below).
const POSITION_ATTRIBUTE_WEIGHTS: Record<CareerPosition, CareerAttributes> = {
  forward: { shooting: 0.35, pace: 0.25, physical: 0.2, passing: 0.15, defending: 0.05 },
  midfielder: { passing: 0.35, physical: 0.2, pace: 0.2, shooting: 0.15, defending: 0.1 },
  defender: { defending: 0.4, physical: 0.25, pace: 0.15, passing: 0.15, shooting: 0.05 },
  goalkeeper: { defending: 0.5, physical: 0.25, passing: 0.15, pace: 0.1, shooting: 0 },
};

export function computeOvr(
  attributes: CareerAttributes,
  position: CareerPosition,
): number {
  const weights = POSITION_ATTRIBUTE_WEIGHTS[position];
  const raw = ATTRIBUTE_KEYS.reduce(
    (sum, attr) => sum + attributes[attr] * weights[attr],
    0,
  );
  return clamp(Math.round(raw), MIN_OVR, MAX_OVR);
}

// Which 2 attributes grow the most from a good performance, per position —
// kept as a simple grouping (not the derivation weights above) so the
// growth numbers stay easy to reason about and tune directly by simulation,
// rather than reverse-engineering a scale factor to preserve an old target.
export const POSITION_PRIMARY_ATTRIBUTES: Record<CareerPosition, CareerAttribute[]> = {
  forward: ["shooting", "pace"],
  midfielder: ["passing", "pace"],
  defender: ["defending", "physical"],
  goalkeeper: ["defending", "physical"],
};

function secondaryAttributesFor(position: CareerPosition): CareerAttribute[] {
  const primary = POSITION_PRIMARY_ATTRIBUTES[position];
  return ATTRIBUTE_KEYS.filter((attr) => !primary.includes(attr));
}

export interface SimulateMatchInput {
  attributes: CareerAttributes;
  position: CareerPosition;
  tier: ClubTier;
  energy: number;
  morale: number;
  teamReputation: number;
}

export interface SimulateMatchResult {
  started: boolean;
  ratingX10: number | null;
  goals: number;
  assists: number;
  redCard: boolean;
  attributeDeltas: CareerAttributes;
  ovrDelta: number;
  ovrAfter: number;
  clubResult: ClubResult;
  energyDelta: number;
  moraleDelta: number;
  teamReputationDelta: number;
  fanReputationDelta: number;
  injured: boolean;
  injuryMatchesOut: number;
}

export const EMPTY_ATTRIBUTE_DELTAS: CareerAttributes = {
  pace: 0,
  shooting: 0,
  passing: 0,
  defending: 0,
  physical: 0,
};

// Tiered rating bands (not a flat ±1) so a full career — only ~16 matches,
// given SEASON_LENGTH=2 and forced retirement at 32 — can climb from
// STARTING_OVR=60 into the high 80s/90s. The bands are deliberately
// generous and the thresholds low: an average match (rating ~6) should
// still feel like progress, and only a genuinely bad one costs anything.
// Goal/assist bonuses are large for the same reason — a career is too short
// for small increments to add up.
export const GOAL_OVR_BONUS = 2;
const ASSIST_OVR_BONUS = 1;

const RATING_GROWTH_TIERS: { min: number; primary: number; secondary: number }[] = [
  { min: 8.5, primary: 3, secondary: 2 },
  { min: 7.5, primary: 2, secondary: 1 },
  { min: 6.5, primary: 2, secondary: 1 },
  { min: 5.5, primary: 1, secondary: 0 },
  { min: 4.5, primary: 0, secondary: 0 },
];

function computeAttributeDeltas(
  position: CareerPosition,
  rating: number,
  goals: number,
  assists: number,
): CareerAttributes {
  const tier =
    RATING_GROWTH_TIERS.find((t) => rating >= t.min) ?? { primary: -1, secondary: 0 };

  const primary = POSITION_PRIMARY_ATTRIBUTES[position];
  const secondary = secondaryAttributesFor(position);

  const deltas: CareerAttributes = { ...EMPTY_ATTRIBUTE_DELTAS };
  for (const attr of primary) deltas[attr] += tier.primary;
  for (const attr of secondary) deltas[attr] += tier.secondary;

  // Goals/assists reward the specific skill involved, not a blended number —
  // a defender who scores still gets the shooting bump, which is fine.
  deltas.shooting += goals * GOAL_OVR_BONUS;
  deltas.passing += assists * ASSIST_OVR_BONUS;

  return deltas;
}

export function applyAttributeDeltas(
  attributes: CareerAttributes,
  deltas: CareerAttributes,
): CareerAttributes {
  const next = { ...attributes };
  for (const attr of ATTRIBUTE_KEYS) {
    next[attr] = clamp(attributes[attr] + deltas[attr], MIN_OVR, MAX_OVR);
  }
  return next;
}

// A small, mostly-fatigue-driven chance of getting hurt — a second risk axis
// alongside red cards/suspension, distinct in flavor (bad luck, not a skill
// failure — no lasting attribute penalty, just lost playing time).
const INJURY_BASE_PROBABILITY = 0.01;
const INJURY_FATIGUE_THRESHOLD = 30;

function rollInjury(energy: number): boolean {
  const fatigueRisk =
    energy < INJURY_FATIGUE_THRESHOLD
      ? (INJURY_FATIGUE_THRESHOLD - energy) / 100
      : 0;
  return Math.random() < INJURY_BASE_PROBABILITY + fatigueRisk;
}

const GOAL_BASE_PROBABILITY: Record<CareerPosition, number> = {
  forward: 0.45,
  midfielder: 0.2,
  defender: 0.08,
  goalkeeper: 0,
};

const ASSIST_BASE_PROBABILITY: Record<CareerPosition, number> = {
  forward: 0.15,
  midfielder: 0.25,
  defender: 0.1,
  goalkeeper: 0.02,
};

const CLUB_RESULT_PROBABILITY: Record<
  ClubTier,
  { win: number; draw: number; loss: number }
> = {
  strong: { win: 0.55, draw: 0.25, loss: 0.2 },
  mid: { win: 0.4, draw: 0.3, loss: 0.3 },
  weak: { win: 0.25, draw: 0.3, loss: 0.45 },
};

// Defenders/midfielders foul more often than forwards; goalkeepers rarely
// pick up a red card.
const RED_CARD_PROBABILITY: Record<CareerPosition, number> = {
  forward: 0.02,
  midfielder: 0.03,
  defender: 0.05,
  goalkeeper: 0.015,
};

const RED_CARD_RATING_PENALTY = 2.5;
const BENCH_ENERGY_RECOVERY = 5;
const MIN_MATCH_ENERGY_COST = 8;
const MAX_MATCH_ENERGY_COST = 16;

// The off-season break. Without it energy only ever recovered from being
// benched, which stopped happening once getStarterProbability started
// returning 1 for any non-terrible player — energy then hit 0 by ~match 10
// and stayed there for the rest of every career, dragging ratings down and
// pushing the fatigue-driven injury roll (see rollInjury) permanently high.
// Deliberately a little under one season's drain (~24 at SEASON_LENGTH = 2)
// so energy still trends down over a career and stays a real constraint the
// player manages — rather than a decorative bar that never moves.
export const SEASON_ENERGY_RECOVERY = 20;

// Below this the player is too spent to be risked: the match becomes a
// forced rest (see `restMatch` in hooks/use-local-career.ts) and life-event
// options that would cost more energy than remains are locked out.
export const LOW_ENERGY_THRESHOLD = 25;
export const REST_ENERGY_RECOVERY = 45;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

// The OVR at which the manager considers you an automatic starter — above
// it you always play, below it you fight for the shirt. Being benched is
// meant to be a rare punishment for a genuinely bad player, not the default
// experience, so even a big club's bar sits just above STARTING_OVR.
const AUTO_STARTER_OVR: Record<ClubTier, number> = {
  strong: 62,
  mid: 55,
  weak: MIN_OVR,
};

export function getStarterProbability(
  tier: ClubTier,
  ovr: number,
  teamReputation = 50,
): number {
  const threshold = AUTO_STARTER_OVR[tier];
  if (ovr >= threshold) return 1;

  // Below the bar, odds scale from "barely ever plays" at MIN_OVR up to the
  // threshold. A manager who trusts you plays you more — a small signed
  // nudge, not a dominant factor next to OVR.
  const reputationNudge = clamp((teamReputation - 50) / 200, -0.1, 0.1);
  const progress = (ovr - MIN_OVR) / (threshold - MIN_OVR);

  return clamp(0.35 + progress * 0.6 + reputationNudge, 0.2, 1);
}

function rollStarter(
  tier: ClubTier,
  ovr: number,
  teamReputation: number,
): boolean {
  return Math.random() < getStarterProbability(tier, ovr, teamReputation);
}

function computeRating(ovr: number, energy: number, morale: number): number {
  const baseline = 5.0 + (ovr / 99) * 3.5;
  // Fatigue drags rating down as energy depletes; morale nudges it either way.
  const fatigueTerm = -((100 - energy) / 100) * 1.5;
  const moraleTerm = ((morale - 50) / 100) * 1.0;
  const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;
  return clamp(baseline + fatigueTerm + moraleTerm + noise, 3, 10);
}

// A small, concentrated dip on the position's specialty attributes — rather
// than reinventing a flat OVR penalty, it hits the same attributes growth
// would have targeted, so a bad-discipline match visibly sets back the
// player's main skill instead of an opaque single number.
function redCardAttributeDeltas(position: CareerPosition): CareerAttributes {
  const deltas = { ...EMPTY_ATTRIBUTE_DELTAS };
  for (const attr of POSITION_PRIMARY_ATTRIBUTES[position]) deltas[attr] = -1;
  return deltas;
}

function rollGoals(position: CareerPosition, rating: number): number {
  if (position === "goalkeeper") return 0;

  const probability = clamp01(
    GOAL_BASE_PROBABILITY[position] + (rating - 6) / 10,
  );

  if (Math.random() >= probability) return 0;

  return Math.random() < 0.15 ? 2 : 1;
}

function rollAssists(position: CareerPosition, rating: number): number {
  const probability = clamp01(
    ASSIST_BASE_PROBABILITY[position] + (rating - 6) / 10,
  );

  return Math.random() < probability ? 1 : 0;
}

function rollClubResult(tier: ClubTier): ClubResult {
  const { win, draw } = CLUB_RESULT_PROBABILITY[tier];
  const roll = Math.random();

  if (roll < win) return "win";
  if (roll < win + draw) return "draw";
  return "loss";
}

export function simulateMatch(input: SimulateMatchInput): SimulateMatchResult {
  const { attributes, position, tier, energy, morale, teamReputation } = input;
  const ovr = computeOvr(attributes, position);

  const started = rollStarter(tier, ovr, teamReputation);
  const clubResult = rollClubResult(tier);

  if (!started) {
    return {
      started: false,
      ratingX10: null,
      goals: 0,
      assists: 0,
      redCard: false,
      attributeDeltas: EMPTY_ATTRIBUTE_DELTAS,
      ovrDelta: 0,
      ovrAfter: ovr,
      clubResult,
      energyDelta: BENCH_ENERGY_RECOVERY,
      moraleDelta: 0,
      teamReputationDelta: 0,
      fanReputationDelta: 0,
      injured: false,
      injuryMatchesOut: 0,
    };
  }

  const redCard = Math.random() < RED_CARD_PROBABILITY[position];
  // An injury takes precedence over a penalty-kick roll for this match (both
  // are one-off special interactions; stacking them adds complexity for no
  // real benefit) — bad luck, not a skill failure, so no rating penalty.
  const injured = !redCard && rollInjury(energy);

  const baseRating = computeRating(ovr, energy, morale);
  const rating = redCard
    ? clamp(baseRating - RED_CARD_RATING_PENALTY, 3, 10)
    : baseRating;
  const goals = redCard || injured ? 0 : rollGoals(position, rating);
  const assists = redCard || injured ? 0 : rollAssists(position, rating);

  const attributeDeltas = redCard
    ? redCardAttributeDeltas(position)
    : injured
      ? EMPTY_ATTRIBUTE_DELTAS
      : computeAttributeDeltas(position, rating, goals, assists);

  const nextAttributes = applyAttributeDeltas(attributes, attributeDeltas);
  const ovrAfter = computeOvr(nextAttributes, position);

  let moraleDelta = 0;
  if (clubResult === "win") moraleDelta += 3;
  else if (clubResult === "loss") moraleDelta -= 2;
  if (goals > 0) moraleDelta += 3;
  if (assists > 0) moraleDelta += 2;
  if (redCard) moraleDelta -= 8;
  if (injured) moraleDelta -= 5;

  let teamReputationDelta = 0;
  if (rating >= 7) teamReputationDelta += 2;
  else if (rating < 5.5) teamReputationDelta -= 1;
  if (clubResult === "win") teamReputationDelta += 1;
  if (redCard) teamReputationDelta -= 4;

  let fanReputationDelta = goals * 3 + assists * 1;
  if (clubResult === "win") fanReputationDelta += 1;
  else if (clubResult === "loss" && rating < 5.5) fanReputationDelta -= 1;
  if (redCard) fanReputationDelta -= 5;

  const energyDelta = -Math.round(
    MIN_MATCH_ENERGY_COST +
      Math.random() * (MAX_MATCH_ENERGY_COST - MIN_MATCH_ENERGY_COST),
  );

  const injuryMatchesOut = injured ? (Math.random() < 0.5 ? 1 : 2) : 0;

  return {
    started: true,
    ratingX10: Math.round(rating * 10),
    goals,
    assists,
    redCard,
    attributeDeltas,
    ovrDelta: ovrAfter - ovr,
    ovrAfter,
    clubResult,
    energyDelta,
    moraleDelta,
    teamReputationDelta,
    fanReputationDelta,
    injured,
    injuryMatchesOut,
  };
}

// Position-weighted chance a penalty is awarded in a given (started,
// non-red-card) match — forwards/midfielders win them more often than
// defenders; goalkeepers never take them.
const PENALTY_PROBABILITY: Record<CareerPosition, number> = {
  forward: 0.12,
  midfielder: 0.08,
  defender: 0.04,
  goalkeeper: 0,
};

export function rollPenaltyChance(position: CareerPosition): boolean {
  return Math.random() < PENALTY_PROBABILITY[position];
}

export interface PenaltyKeeperState {
  diveX: number;
  diveY: number;
  saveRadius: number;
}

// The keeper commits to a dive spot + reach before the player aims — hidden
// from the UI until the ball is kicked, so the tap is a real guess, not a
// reaction to visible information.
export function generateKeeperDive(): PenaltyKeeperState {
  return {
    diveX: Math.random(),
    diveY: Math.random() * 0.7,
    saveRadius: 0.22 + Math.random() * 0.08,
  };
}

export type PenaltyOutcome = "goal" | "save" | "wide";

const PENALTY_WIDE_MARGIN = 0.08;
const PENALTY_WIDE_CHANCE = 0.35;
const PENALTY_CAUGHT_SAVE_CHANCE = 0.75;

// aimX/aimY are normalized [0,1] within the goal frame (0,0 = bottom-left
// post, 1,1 = top-right post). Aiming near the frame edges risks going
// wide; aiming within the keeper's (unknown-to-the-player) reach usually
// gets saved, but not always — placement/power can still beat a fingertip.
export function resolvePenaltyKick(
  aimX: number,
  aimY: number,
  keeper: PenaltyKeeperState,
): PenaltyOutcome {
  const nearEdge =
    aimX < PENALTY_WIDE_MARGIN ||
    aimX > 1 - PENALTY_WIDE_MARGIN ||
    aimY > 1 - PENALTY_WIDE_MARGIN;

  if (nearEdge && Math.random() < PENALTY_WIDE_CHANCE) return "wide";

  const dx = aimX - keeper.diveX;
  const dy = aimY - keeper.diveY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < keeper.saveRadius) {
    return Math.random() < PENALTY_CAUGHT_SAVE_CHANCE ? "save" : "goal";
  }

  return "goal";
}

export interface TransferOfferClub {
  id: string;
  name: string;
  tier: ClubTier;
}

function tierWeight(tier: ClubTier, ovr: number, fanReputation = 50): number {
  if (tier === "strong") {
    // Fan reputation nudges the odds a big club comes calling — a modest
    // effect next to OVR, not a replacement for it.
    const reputationBoost = clamp((fanReputation - 50) / 200, -0.15, 0.15);
    return Math.max(0.15, (ovr - 45) / 45 + reputationBoost);
  }
  if (tier === "weak") return Math.max(0.15, (85 - ovr) / 85);
  return 1;
}

// Weighted-random pick of 3 distinct clubs (any nationality) interested in
// signing the player — better OVR skews offers toward stronger clubs.
export function pickTransferOffers<T extends TransferOfferClub>(
  pool: T[],
  excludeClubId: string,
  ovr: number,
  count = 3,
  fanReputation = 50,
): T[] {
  const remaining = pool.filter((c) => c.id !== excludeClubId);
  const picks: T[] = [];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const weights = remaining.map((c) => tierWeight(c.tier, ovr, fanReputation));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;

    let index = 0;
    for (; index < weights.length - 1; index++) {
      roll -= weights[index];
      if (roll <= 0) break;
    }

    picks.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return picks;
}

export type RelationshipStatus = "soltero" | "en pareja";

export interface LifeEventOption {
  label: string;
  energyDelta: number;
  moraleDelta: number;
  relationshipStatus?: RelationshipStatus;
  teamReputationDelta?: number;
  fanReputationDelta?: number;
}

export interface LifeEvent {
  id: string;
  title: string;
  description: string;
  optionA: LifeEventOption;
  optionB: LifeEventOption;
  requiresRelationship?: boolean;
  excludesRelationship?: boolean;
}

// A life-sim layer between seasons: each event is a real trade-off (energy
// vs morale, or a relationship-status change), not just flavor text.
export const LIFE_EVENTS: LifeEvent[] = [
  {
    id: "meet-someone",
    title: "Conociste a alguien",
    description:
      "Un amigo te invita a salir y te presenta a alguien que te llama la atención.",
    optionA: {
      label: "Salir con ella/él",
      energyDelta: -10,
      moraleDelta: 15,
      relationshipStatus: "en pareja",
    },
    optionB: {
      label: "Enfocarte en el fútbol",
      energyDelta: 0,
      moraleDelta: 0,
    },
    excludesRelationship: true,
  },
  {
    id: "team-party",
    title: "Fiesta del plantel",
    description: "Tus compañeros organizan una fiesta después del partido.",
    optionA: { label: "Ir a la fiesta", energyDelta: -15, moraleDelta: 10 },
    optionB: { label: "Quedarte a descansar", energyDelta: 10, moraleDelta: -5 },
  },
  {
    id: "extra-training",
    title: "Sesión extra de entrenamiento",
    description: "El preparador físico te ofrece una sesión extra esta semana.",
    optionA: { label: "Entrenar más", energyDelta: -12, moraleDelta: 5 },
    optionB: { label: "Descansar", energyDelta: 15, moraleDelta: 0 },
  },
  {
    id: "press-interview",
    title: "Entrevista con la prensa",
    description: "Un canal de televisión quiere entrevistarte después del partido.",
    optionA: { label: "Dar la entrevista", energyDelta: -5, moraleDelta: 10 },
    optionB: { label: "Rechazarla", energyDelta: 0, moraleDelta: 0 },
  },
  {
    id: "relationship-fight",
    title: "Pelea con tu pareja",
    description: "Tuviste una discusión fuerte esta semana.",
    optionA: { label: "Hacer las paces", energyDelta: -5, moraleDelta: 10 },
    optionB: {
      label: "Terminar la relación",
      energyDelta: 5,
      moraleDelta: -10,
      relationshipStatus: "soltero",
    },
    requiresRelationship: true,
  },
  {
    id: "sponsor-offer",
    title: "Oferta de un sponsor",
    description: "Una marca deportiva te ofrece grabar un comercial.",
    optionA: { label: "Aceptar", energyDelta: -8, moraleDelta: 12 },
    optionB: { label: "Rechazar", energyDelta: 0, moraleDelta: 0 },
  },
  {
    id: "teammate-needs-help",
    title: "Un compañero nuevo pide una mano",
    description:
      "Un refuerzo recién llegado no conoce la ciudad y te pide ayuda para instalarse.",
    optionA: {
      label: "Ayudarlo",
      energyDelta: -10,
      moraleDelta: 2,
      teamReputationDelta: 6,
    },
    optionB: {
      label: "Decirle que no tenés tiempo",
      energyDelta: 5,
      moraleDelta: 0,
      teamReputationDelta: -3,
    },
  },
  {
    id: "fan-request",
    title: "La hinchada te pide una foto",
    description:
      "Un grupo de hinchas te reconoce a la salida del estadio y te pide fotos y autógrafos.",
    optionA: {
      label: "Quedarte a saludar",
      energyDelta: -8,
      moraleDelta: 5,
      fanReputationDelta: 6,
    },
    optionB: {
      label: "Seguir de largo",
      energyDelta: 5,
      moraleDelta: -3,
      fanReputationDelta: -3,
    },
  },
];

export function pickLifeEvent(relationshipStatus: RelationshipStatus): LifeEvent {
  const pool = LIFE_EVENTS.filter((event) => {
    if (event.requiresRelationship && relationshipStatus !== "en pareja") {
      return false;
    }
    if (event.excludesRelationship && relationshipStatus === "en pareja") {
      return false;
    }
    return true;
  });

  return pool[Math.floor(Math.random() * pool.length)];
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  seasonNumber: number;
  age: number;
}

export interface SeasonAwardMatch {
  started: boolean;
  rating: number | null;
  goals: number;
}

export interface SeasonAwardContext {
  seasonNumber: number;
  age: number;
  ovr: number;
  teamReputation: number;
  fanReputation: number;
}

const SEASON_GOAL_THRESHOLD = 2;
const SEASON_RATING_THRESHOLD = 7.5;
const FAN_REPUTATION_MILESTONE = 80;
const TEAM_REPUTATION_MILESTONE = 80;
const ELITE_OVR_MILESTONE = 90;

// Called once per season rollover. Per-season awards (goleador/figura) use an
// id keyed to that season number, so they naturally never duplicate; the
// one-time milestones are guarded by `alreadyEarnedIds` so they fire exactly
// once across the whole career, whichever season first crosses the bar.
export function computeSeasonAwards(
  seasonMatches: SeasonAwardMatch[],
  context: SeasonAwardContext,
  alreadyEarnedIds: Set<string>,
): Trophy[] {
  const trophies: Trophy[] = [];
  const started = seasonMatches.filter((m) => m.started);
  const totalGoals = seasonMatches.reduce((sum, m) => sum + m.goals, 0);
  const avgRating = started.length
    ? started.reduce((sum, m) => sum + (m.rating ?? 0), 0) / started.length / 10
    : 0;

  if (totalGoals >= SEASON_GOAL_THRESHOLD) {
    trophies.push({
      id: `goleador-s${context.seasonNumber}`,
      title: "Goleador de la Temporada",
      description: `${totalGoals} goles en la temporada ${context.seasonNumber}`,
      seasonNumber: context.seasonNumber,
      age: context.age,
    });
  }

  if (started.length > 0 && avgRating >= SEASON_RATING_THRESHOLD) {
    trophies.push({
      id: `figura-s${context.seasonNumber}`,
      title: "Máxima Figura",
      description: `Promedio ${avgRating.toFixed(1)} en la temporada ${context.seasonNumber}`,
      seasonNumber: context.seasonNumber,
      age: context.age,
    });
  }

  if (
    !alreadyEarnedIds.has("idolo-hinchada") &&
    context.fanReputation >= FAN_REPUTATION_MILESTONE
  ) {
    trophies.push({
      id: "idolo-hinchada",
      title: "Ídolo de la Hinchada",
      description: "Alcanzaste 80 de reputación con los hinchas",
      seasonNumber: context.seasonNumber,
      age: context.age,
    });
  }

  if (
    !alreadyEarnedIds.has("capitan-vestuario") &&
    context.teamReputation >= TEAM_REPUTATION_MILESTONE
  ) {
    trophies.push({
      id: "capitan-vestuario",
      title: "Capitán del Vestuario",
      description: "Alcanzaste 80 de reputación con el plantel",
      seasonNumber: context.seasonNumber,
      age: context.age,
    });
  }

  if (!alreadyEarnedIds.has("elite-mundial") && context.ovr >= ELITE_OVR_MILESTONE) {
    trophies.push({
      id: "elite-mundial",
      title: "Élite Mundial",
      description: "Alcanzaste 90 de OVR",
      seasonNumber: context.seasonNumber,
      age: context.age,
    });
  }

  return trophies;
}
