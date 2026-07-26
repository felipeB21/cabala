"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AGE_STEP,
  EMPTY_ATTRIBUTE_DELTAS,
  GOAL_OVR_BONUS,
  RETIREMENT_AGE,
  SEASON_LENGTH,
  STARTING_AGE,
  STARTING_OVR,
  applyAttributeDeltas,
  computeOvr,
  computeSeasonAwards,
  createStartingAttributes,
  generateKeeperDive,
  pickLifeEvent,
  pickTransferOffers,
  rollPenaltyChance,
  simulateMatch,
  type CareerAttributes,
  type CareerPosition,
  type ClubResult,
  type ClubTier,
  type LifeEvent,
  type PenaltyKeeperState,
  type PenaltyOutcome,
  type RelationshipStatus,
  type SimulateMatchResult,
  type Trophy,
} from "@/lib/career";

const STORAGE_KEY = "cabala:career";
const STARTING_ENERGY = 100;
const STARTING_MORALE = 50;
const STARTING_TEAM_REPUTATION = 50;
const STARTING_FAN_REPUTATION = 50;

export interface LocalCareerClub {
  id: string;
  name: string;
  tier: ClubTier;
  logo?: string | null;
}

export interface LocalCareerMatch {
  seasonNumber: number;
  matchNumber: number;
  started: boolean;
  rating: number | null;
  goals: number;
  assists: number;
  redCard: boolean;
  injured: boolean;
  ovrDelta: number;
  ovrAfter: number;
  ageAtMatch: number;
  clubResult: ClubResult;
}

interface PendingPenalty {
  keeper: PenaltyKeeperState;
  sim: SimulateMatchResult;
  matchesPlayedInSeason: number;
}

export interface LocalCareer {
  jerseyName: string;
  squadNumber: number;
  nationality: string;
  position: CareerPosition;
  club: LocalCareerClub;
  ovr: number;
  attributes: CareerAttributes;
  age: number;
  seasonNumber: number;
  matchesPlayedInSeason: number;
  appearances: number;
  goals: number;
  assists: number;
  energy: number;
  morale: number;
  teamReputation: number;
  fanReputation: number;
  relationshipStatus: RelationshipStatus;
  suspended: boolean;
  injuredMatchesRemaining: number;
  matches: LocalCareerMatch[];
  trophies: Trophy[];
  clubsHistory: string[];
  retired: boolean;
  // Set right after a season rolls over (until resolved) — 3 clubs
  // interested in signing the player, replacing the "simulate" action.
  pendingOffers: LocalCareerClub[] | null;
  // Mutually exclusive with pendingOffers — a life-sim choice event that
  // also replaces the "simulate" action until resolved.
  pendingLifeEvent: LifeEvent | null;
  // Set mid-simulation when a penalty is awarded — holds everything needed
  // to finish the match once the player takes the kick. Mutually exclusive
  // with pendingOffers/pendingLifeEvent (it only ever appears before a
  // season-rollover check even runs).
  pendingPenalty: PendingPenalty | null;
  // Whether this career has ever been saved to (or hydrated from) the
  // server — purely a UI hint, doesn't affect simulation.
  linkedToServer: boolean;
}

export type NewCareerInput = Pick<
  LocalCareer,
  "jerseyName" | "squadNumber" | "nationality" | "position" | "club"
>;

export type SimulateResult =
  | { type: "penalty"; keeper: PenaltyKeeperState }
  | { type: "match"; match: LocalCareerMatch };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// localStorage is long-lived, user-controlled state — a career saved before
// a field existed (energy/morale, then teamReputation/fanReputation/
// pendingPenalty, then trophies, each added in a later pass) simply won't
// have it in the parsed JSON, even though `LocalCareer` now requires it.
// Backfill sane defaults for anything missing instead of trusting the cast.
function normalizeCareer(raw: unknown): LocalCareer | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<LocalCareer>;
  if (!c.jerseyName || !c.club) return null;

  // A career saved before attributes existed only has the old single `ovr`
  // — backfill all 5 to that value (not a fresh STARTING_OVR) so it doesn't
  // look like progress reset.
  const attributes =
    c.attributes ??
    (c.ovr
      ? {
          pace: c.ovr,
          shooting: c.ovr,
          passing: c.ovr,
          defending: c.ovr,
          physical: c.ovr,
        }
      : createStartingAttributes());

  return {
    ...c,
    attributes,
    energy: c.energy ?? STARTING_ENERGY,
    morale: c.morale ?? STARTING_MORALE,
    teamReputation: c.teamReputation ?? STARTING_TEAM_REPUTATION,
    fanReputation: c.fanReputation ?? STARTING_FAN_REPUTATION,
    injuredMatchesRemaining: c.injuredMatchesRemaining ?? 0,
    matches: c.matches ?? [],
    trophies: c.trophies ?? [],
    clubsHistory: c.clubsHistory ?? [c.club.name],
    pendingOffers: c.pendingOffers ?? null,
    pendingLifeEvent: c.pendingLifeEvent ?? null,
    pendingPenalty: c.pendingPenalty ?? null,
    linkedToServer: c.linkedToServer ?? false,
  } as LocalCareer;
}

function loadFromStorage(): LocalCareer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeCareer(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function persistToStorage(career: LocalCareer | null) {
  if (typeof window === "undefined") return;
  if (career) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(career));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

// Turns a completed `simulateMatch` result into a committed match record +
// next career state — shared by the immediate-commit path and the
// post-penalty-resolution path, so season-rollover/offer/life-event logic
// only lives in one place.
function finalizeMatch(
  career: LocalCareer,
  sim: SimulateMatchResult,
  matchesPlayedInSeason: number,
  allClubs: LocalCareerClub[],
): { next: LocalCareer; matchRecord: LocalCareerMatch } {
  const nextAttributes = applyAttributeDeltas(
    career.attributes,
    sim.attributeDeltas,
  );
  const ovrAfter = computeOvr(nextAttributes, career.position);
  const nextEnergy = clamp(career.energy + sim.energyDelta, 0, 100);
  const nextMorale = clamp(career.morale + sim.moraleDelta, 0, 100);
  const nextTeamReputation = clamp(
    career.teamReputation + sim.teamReputationDelta,
    0,
    100,
  );
  const nextFanReputation = clamp(
    career.fanReputation + sim.fanReputationDelta,
    0,
    100,
  );

  const seasonRolledOver = matchesPlayedInSeason >= SEASON_LENGTH;

  let nextAge = career.age;
  let retired: boolean = career.retired;
  let nextSeasonNumber = career.seasonNumber;
  let nextMatchesPlayedInSeason = matchesPlayedInSeason;
  let pendingOffers: LocalCareerClub[] | null = null;
  let pendingLifeEvent: LifeEvent | null = null;

  if (seasonRolledOver) {
    const proposedAge = career.age + AGE_STEP;
    if (proposedAge >= RETIREMENT_AGE) {
      nextAge = RETIREMENT_AGE;
      retired = true;
    } else {
      nextAge = proposedAge;
      // Never both at once — alternate randomly so decisions don't
      // stack up every single rollover.
      if (Math.random() < 0.5 && allClubs.length > 0) {
        pendingOffers = pickTransferOffers(
          allClubs,
          career.club.id,
          ovrAfter,
          3,
          nextFanReputation,
        );
      } else {
        pendingLifeEvent = pickLifeEvent(career.relationshipStatus);
      }
    }
    nextSeasonNumber = career.seasonNumber + 1;
    nextMatchesPlayedInSeason = 0;
  }

  const matchRecord: LocalCareerMatch = {
    seasonNumber: career.seasonNumber,
    matchNumber: matchesPlayedInSeason,
    started: sim.started,
    rating: sim.ratingX10,
    goals: sim.goals,
    assists: sim.assists,
    redCard: sim.redCard,
    injured: sim.injured,
    ovrDelta: ovrAfter - career.ovr,
    ovrAfter,
    ageAtMatch: career.age,
    clubResult: sim.clubResult,
  };

  let trophies = career.trophies;
  if (seasonRolledOver) {
    const seasonMatches = [...career.matches, matchRecord].filter(
      (m) => m.seasonNumber === career.seasonNumber,
    );
    const newTrophies = computeSeasonAwards(
      seasonMatches,
      {
        seasonNumber: career.seasonNumber,
        age: career.age,
        ovr: ovrAfter,
        teamReputation: nextTeamReputation,
        fanReputation: nextFanReputation,
      },
      new Set(career.trophies.map((t) => t.id)),
    );
    if (newTrophies.length > 0) {
      trophies = [...career.trophies, ...newTrophies];
    }
  }

  const next: LocalCareer = {
    ...career,
    ovr: ovrAfter,
    attributes: nextAttributes,
    age: nextAge,
    seasonNumber: nextSeasonNumber,
    matchesPlayedInSeason: nextMatchesPlayedInSeason,
    appearances: career.appearances + (sim.started ? 1 : 0),
    goals: career.goals + sim.goals,
    assists: career.assists + sim.assists,
    energy: nextEnergy,
    morale: nextMorale,
    teamReputation: nextTeamReputation,
    fanReputation: nextFanReputation,
    suspended: sim.redCard,
    injuredMatchesRemaining: sim.injured
      ? sim.injuryMatchesOut
      : career.injuredMatchesRemaining,
    matches: [...career.matches, matchRecord],
    trophies,
    retired,
    pendingOffers,
    pendingLifeEvent,
    pendingPenalty: null,
  };

  return { next, matchRecord };
}

export function useLocalCareer() {
  const [career, setCareer] = useState<LocalCareer | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage isn't available during SSR, so the initial state must be
    // null to match the server-rendered output; this effect performs the
    // one-time client-only read after mount. `hydrated` lets consumers hold
    // off rendering the wizard/dashboard branch until this resolves, so
    // there's no flash of the wrong state or hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCareer(loadFromStorage());
    setHydrated(true);
  }, []);

  const createCareer = useCallback((input: NewCareerInput) => {
    const fresh: LocalCareer = {
      ...input,
      ovr: STARTING_OVR,
      attributes: createStartingAttributes(),
      age: STARTING_AGE,
      seasonNumber: 1,
      matchesPlayedInSeason: 0,
      appearances: 0,
      goals: 0,
      assists: 0,
      energy: STARTING_ENERGY,
      morale: STARTING_MORALE,
      teamReputation: STARTING_TEAM_REPUTATION,
      fanReputation: STARTING_FAN_REPUTATION,
      relationshipStatus: "soltero",
      suspended: false,
      injuredMatchesRemaining: 0,
      matches: [],
      trophies: [],
      clubsHistory: [input.club.name],
      retired: false,
      pendingOffers: null,
      pendingLifeEvent: null,
      pendingPenalty: null,
      linkedToServer: false,
    };
    setCareer(fresh);
    persistToStorage(fresh);
  }, []);

  const simulateNextMatch = useCallback(
    (allClubs: LocalCareerClub[]): SimulateResult | null => {
      if (
        !career ||
        career.retired ||
        career.pendingOffers ||
        career.pendingLifeEvent ||
        career.pendingPenalty
      ) {
        return null;
      }

      // Serving a red-card suspension: sit out this match entirely, no
      // starter roll, no rating. Still routed through `finalizeMatch` (as a
      // zero-impact "sim") so a season that happens to end on a suspension
      // still gets age progression, transfer offers/life events, and
      // trophy checks like any other match.
      if (career.suspended) {
        const matchesPlayedInSeason = career.matchesPlayedInSeason + 1;
        const sim: SimulateMatchResult = {
          started: false,
          ratingX10: null,
          goals: 0,
          assists: 0,
          redCard: false,
          attributeDeltas: EMPTY_ATTRIBUTE_DELTAS,
          ovrDelta: 0,
          ovrAfter: career.ovr,
          clubResult: "draw",
          energyDelta: 5,
          moraleDelta: 0,
          teamReputationDelta: 0,
          fanReputationDelta: 0,
          injured: false,
          injuryMatchesOut: 0,
        };

        const { next, matchRecord } = finalizeMatch(
          career,
          sim,
          matchesPlayedInSeason,
          allClubs,
        );

        setCareer(next);
        persistToStorage(next);
        return { type: "match", match: matchRecord };
      }

      // Sitting out an injury: same zero-impact treatment as suspension, but
      // recovers more energy (getting healthy again) and decrements the
      // remaining-matches counter instead of clearing a single boolean.
      if (career.injuredMatchesRemaining > 0) {
        const matchesPlayedInSeason = career.matchesPlayedInSeason + 1;
        const sim: SimulateMatchResult = {
          started: false,
          ratingX10: null,
          goals: 0,
          assists: 0,
          redCard: false,
          attributeDeltas: EMPTY_ATTRIBUTE_DELTAS,
          ovrDelta: 0,
          ovrAfter: career.ovr,
          clubResult: "draw",
          energyDelta: 15,
          moraleDelta: 0,
          teamReputationDelta: 0,
          fanReputationDelta: 0,
          injured: false,
          injuryMatchesOut: 0,
        };

        const { next, matchRecord } = finalizeMatch(
          career,
          sim,
          matchesPlayedInSeason,
          allClubs,
        );
        const withDecrement: LocalCareer = {
          ...next,
          injuredMatchesRemaining: career.injuredMatchesRemaining - 1,
        };

        setCareer(withDecrement);
        persistToStorage(withDecrement);
        return { type: "match", match: matchRecord };
      }

      const sim = simulateMatch({
        attributes: career.attributes,
        position: career.position,
        tier: career.club.tier,
        energy: career.energy,
        morale: career.morale,
        teamReputation: career.teamReputation,
      });

      const matchesPlayedInSeason = career.matchesPlayedInSeason + 1;

      // A penalty pauses the simulation for user input — the match isn't
      // finalized (goals/OVR/reputation/season-rollover) until the player
      // takes the kick and `resolvePenaltyOutcome` runs. Skipped on a red
      // card or injury — both already end the player's involvement this
      // match, so there's nothing left to take a kick over.
      if (
        sim.started &&
        !sim.redCard &&
        !sim.injured &&
        rollPenaltyChance(career.position)
      ) {
        const keeper = generateKeeperDive();
        const next: LocalCareer = {
          ...career,
          pendingPenalty: { keeper, sim, matchesPlayedInSeason },
        };
        setCareer(next);
        persistToStorage(next);
        return { type: "penalty", keeper };
      }

      const { next, matchRecord } = finalizeMatch(
        career,
        sim,
        matchesPlayedInSeason,
        allClubs,
      );

      setCareer(next);
      persistToStorage(next);

      return { type: "match", match: matchRecord };
    },
    [career],
  );

  const resolvePenaltyOutcome = useCallback(
    (outcome: PenaltyOutcome, allClubs: LocalCareerClub[]): LocalCareerMatch | null => {
      if (!career || !career.pendingPenalty) return null;

      const { sim: baseSim, matchesPlayedInSeason } = career.pendingPenalty;

      const sim: SimulateMatchResult =
        outcome === "goal"
          ? {
              ...baseSim,
              goals: baseSim.goals + 1,
              // Same shooting bonus a normal goal gives, just applied to the
              // penalty's already-computed deltas instead of the un-taken
              // regular-play goal roll.
              attributeDeltas: {
                ...baseSim.attributeDeltas,
                shooting: baseSim.attributeDeltas.shooting + GOAL_OVR_BONUS,
              },
              fanReputationDelta: baseSim.fanReputationDelta + 4,
            }
          : { ...baseSim, fanReputationDelta: baseSim.fanReputationDelta - 1 };

      const { next, matchRecord } = finalizeMatch(
        career,
        sim,
        matchesPlayedInSeason,
        allClubs,
      );

      setCareer(next);
      persistToStorage(next);

      return matchRecord;
    },
    [career],
  );

  const resolveOffer = useCallback((clubId: string | null) => {
    setCareer((prev) => {
      if (!prev || !prev.pendingOffers) return prev;

      const chosen = clubId
        ? prev.pendingOffers.find((c) => c.id === clubId)
        : undefined;

      const next: LocalCareer = {
        ...prev,
        club: chosen ?? prev.club,
        clubsHistory: chosen
          ? [...prev.clubsHistory, chosen.name]
          : prev.clubsHistory,
        pendingOffers: null,
      };

      persistToStorage(next);
      return next;
    });
  }, []);

  const resolveLifeEvent = useCallback((choice: "A" | "B") => {
    setCareer((prev) => {
      if (!prev || !prev.pendingLifeEvent) return prev;

      const option =
        choice === "A" ? prev.pendingLifeEvent.optionA : prev.pendingLifeEvent.optionB;

      const next: LocalCareer = {
        ...prev,
        energy: clamp(prev.energy + option.energyDelta, 0, 100),
        morale: clamp(prev.morale + option.moraleDelta, 0, 100),
        teamReputation: clamp(
          prev.teamReputation + (option.teamReputationDelta ?? 0),
          0,
          100,
        ),
        fanReputation: clamp(
          prev.fanReputation + (option.fanReputationDelta ?? 0),
          0,
          100,
        ),
        relationshipStatus: option.relationshipStatus ?? prev.relationshipStatus,
        pendingLifeEvent: null,
      };

      persistToStorage(next);
      return next;
    });
  }, []);

  const hydrateFromServer = useCallback((serverCareer: LocalCareer) => {
    setCareer(serverCareer);
    persistToStorage(serverCareer);
  }, []);

  const markSaved = useCallback(() => {
    setCareer((prev) => {
      if (!prev) return prev;
      const next = { ...prev, linkedToServer: true };
      persistToStorage(next);
      return next;
    });
  }, []);

  const resetCareer = useCallback(() => {
    setCareer(null);
    persistToStorage(null);
  }, []);

  return {
    career,
    hydrated,
    createCareer,
    simulateNextMatch,
    resolvePenaltyOutcome,
    resolveOffer,
    resolveLifeEvent,
    hydrateFromServer,
    markSaved,
    resetCareer,
  };
}
