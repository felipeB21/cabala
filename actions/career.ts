"use server";

import { db } from "@/db";
import { careerClub, careerMatch, careerPlayer } from "@/db/schema";
import { getSession } from "@/lib/session";
import {
  AGE_STEP,
  ATTRIBUTE_KEYS,
  MAX_OVR,
  MIN_OVR,
  RETIREMENT_AGE,
  SEASON_LENGTH,
  STARTING_AGE,
  computeOvr,
  type CareerAttributes,
  type CareerPosition,
  type ClubResult,
} from "@/lib/career";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const POSITIONS: CareerPosition[] = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
];

const CLUB_RESULTS: ClubResult[] = ["win", "draw", "loss"];

const MAX_SAVED_MATCHES = 5000;
const MAX_SAVED_TROPHIES = 50;
const MAX_SAVED_CLUBS_HISTORY = 50;
const MAX_INJURED_MATCHES_REMAINING = 3;

export async function getMyCareer() {
  const session = await getSession();
  if (!session?.user) return null;

  const player = await db.query.careerPlayer.findFirst({
    where: eq(careerPlayer.userId, session.user.id),
    with: { club: true },
  });

  return player ?? null;
}

export async function getCareerClubs(nationality: string) {
  if (!nationality) return [];

  return db
    .select()
    .from(careerClub)
    .where(eq(careerClub.nationality, nationality));
}

export async function getAllCareerClubs() {
  return db.select().from(careerClub);
}

export async function getCareerMatchHistory(limit = 20) {
  const session = await getSession();
  if (!session?.user) return [];

  return db
    .select()
    .from(careerMatch)
    .where(eq(careerMatch.userId, session.user.id))
    .orderBy(desc(careerMatch.seasonNumber), desc(careerMatch.matchNumber))
    .limit(limit);
}

interface SaveCareerMatchInput {
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

interface SaveCareerTrophyInput {
  id: string;
  title: string;
  description: string;
  seasonNumber: number;
  age: number;
}

interface SaveCareerInput {
  jerseyName: string;
  squadNumber: number;
  nationality: string;
  position: CareerPosition;
  clubId: string;
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
  relationshipStatus: string;
  suspended: boolean;
  injuredMatchesRemaining: number;
  matches: SaveCareerMatchInput[];
  trophies: SaveCareerTrophyInput[];
  clubsHistory: string[];
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function saveCareer(input: SaveCareerInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Iniciá sesión para guardar tu carrera" };
  }

  const userId = session.user.id;

  const jerseyName = input.jerseyName?.trim().toUpperCase();

  if (!jerseyName || jerseyName.length > 12) {
    return { success: false, error: "Nombre de camiseta inválido (máx. 12 caracteres)" };
  }

  if (
    !Number.isInteger(input.squadNumber) ||
    input.squadNumber < 1 ||
    input.squadNumber > 99
  ) {
    return { success: false, error: "El dorsal debe ser entre 1 y 99" };
  }

  if (!POSITIONS.includes(input.position)) {
    return { success: false, error: "Posición inválida" };
  }

  if (input.matches.length > MAX_SAVED_MATCHES) {
    return { success: false, error: "Historial demasiado largo" };
  }

  if (input.matches.some((m) => !CLUB_RESULTS.includes(m.clubResult))) {
    return { success: false, error: "Resultado de partido inválido" };
  }

  if (input.trophies && input.trophies.length > MAX_SAVED_TROPHIES) {
    return { success: false, error: "Demasiados trofeos" };
  }

  if (input.clubsHistory && input.clubsHistory.length > MAX_SAVED_CLUBS_HISTORY) {
    return { success: false, error: "Historial de clubes demasiado largo" };
  }

  const clubs = await db
    .select()
    .from(careerClub)
    .where(eq(careerClub.id, input.clubId))
    .limit(1);

  const club = clubs[0];

  // Only checks that the club exists — `input.nationality` is the player's
  // own home nationality (fixed at creation), not their current club's,
  // since transfer offers can move a player to a club of any nationality
  // (see pickTransferOffers in lib/career.ts). Requiring them to match here
  // broke saving for anyone who'd ever transferred abroad.
  if (!club) {
    return { success: false, error: "Club inválido" };
  }

  // Sanity bounds — this is client-simulated state, so we clamp/reject
  // obviously-tampered values, but don't fully re-derive stats from the
  // match history (not worth the complexity for a hobby leaderboard).
  // `ovr` is recomputed server-side from the (clamped) attributes rather
  // than trusting the client's number directly — computeOvr is a pure,
  // already-available function, so this is free extra integrity.
  const attributes = Object.fromEntries(
    ATTRIBUTE_KEYS.map((attr) => [
      attr,
      Math.min(Math.max(Math.round(input.attributes?.[attr] ?? MIN_OVR), MIN_OVR), MAX_OVR),
    ]),
  ) as CareerAttributes;
  const ovr = computeOvr(attributes, input.position);

  // Age only ever takes STARTING_AGE, STARTING_AGE + AGE_STEP, + 2*AGE_STEP,
  // ... or is clamped to exactly RETIREMENT_AGE once retired.
  const isValidAgeStep =
    input.age === RETIREMENT_AGE ||
    (input.age >= STARTING_AGE && (input.age - STARTING_AGE) % AGE_STEP === 0);

  if (
    !Number.isInteger(input.age) ||
    input.age < STARTING_AGE ||
    input.age > RETIREMENT_AGE ||
    !isValidAgeStep
  ) {
    return { success: false, error: "Edad inválida" };
  }

  if (
    !Number.isInteger(input.seasonNumber) ||
    input.seasonNumber < 1 ||
    input.seasonNumber > 100
  ) {
    return { success: false, error: "Temporada inválida" };
  }

  if (
    !Number.isInteger(input.matchesPlayedInSeason) ||
    input.matchesPlayedInSeason < 0 ||
    input.matchesPlayedInSeason >= SEASON_LENGTH
  ) {
    return { success: false, error: "Progreso de temporada inválido" };
  }

  if (
    !Number.isInteger(input.appearances) ||
    input.appearances < 0 ||
    !Number.isInteger(input.goals) ||
    input.goals < 0 ||
    !Number.isInteger(input.assists) ||
    input.assists < 0
  ) {
    return { success: false, error: "Estadísticas inválidas" };
  }

  const energy = Math.min(Math.max(Math.round(input.energy ?? 100), 0), 100);
  const morale = Math.min(Math.max(Math.round(input.morale ?? 50), 0), 100);
  const teamReputation = Math.min(
    Math.max(Math.round(input.teamReputation ?? 50), 0),
    100,
  );
  const fanReputation = Math.min(
    Math.max(Math.round(input.fanReputation ?? 50), 0),
    100,
  );
  const relationshipStatus =
    input.relationshipStatus === "en pareja" ? "en pareja" : "soltero";
  const suspended = !!input.suspended;
  const injuredMatchesRemaining = Math.min(
    Math.max(Math.round(input.injuredMatchesRemaining ?? 0), 0),
    MAX_INJURED_MATCHES_REMAINING,
  );
  const trophies = JSON.stringify(input.trophies ?? []);
  const clubsHistory = JSON.stringify(input.clubsHistory ?? []);

  await db.transaction(async (tx) => {
    await tx
      .insert(careerPlayer)
      .values({
        userId,
        jerseyName,
        squadNumber: input.squadNumber,
        nationality: input.nationality,
        position: input.position,
        clubId: club.id,
        ovr,
        pace: attributes.pace,
        shooting: attributes.shooting,
        passing: attributes.passing,
        defending: attributes.defending,
        physical: attributes.physical,
        age: input.age,
        seasonNumber: input.seasonNumber,
        matchesPlayedInSeason: input.matchesPlayedInSeason,
        appearances: input.appearances,
        goals: input.goals,
        assists: input.assists,
        energy,
        morale,
        teamReputation,
        fanReputation,
        relationshipStatus,
        suspended,
        injuredMatchesRemaining,
        trophies,
        clubsHistory,
      })
      .onConflictDoUpdate({
        target: careerPlayer.userId,
        set: {
          jerseyName,
          squadNumber: input.squadNumber,
          nationality: input.nationality,
          position: input.position,
          clubId: club.id,
          ovr,
          pace: attributes.pace,
          shooting: attributes.shooting,
          passing: attributes.passing,
          defending: attributes.defending,
          physical: attributes.physical,
          age: input.age,
          seasonNumber: input.seasonNumber,
          matchesPlayedInSeason: input.matchesPlayedInSeason,
          appearances: input.appearances,
          goals: input.goals,
          assists: input.assists,
          energy,
          morale,
          teamReputation,
          fanReputation,
          relationshipStatus,
          suspended,
          injuredMatchesRemaining,
          trophies,
          clubsHistory,
        },
      });

    await tx.delete(careerMatch).where(eq(careerMatch.userId, userId));

    if (input.matches.length > 0) {
      await tx.insert(careerMatch).values(
        input.matches.map((m) => ({
          id: randomUUID(),
          userId,
          seasonNumber: m.seasonNumber,
          matchNumber: m.matchNumber,
          started: m.started,
          rating: m.rating,
          goals: m.goals,
          assists: m.assists,
          redCard: m.redCard,
          injured: m.injured,
          ovrDelta: m.ovrDelta,
          ovrAfter: m.ovrAfter,
          ageAtMatch: m.ageAtMatch,
          clubResult: m.clubResult,
        })),
      );
    }
  });

  return { success: true };
}

export async function getCareerLeaderboard(limit = 50) {
  return db.query.careerPlayer.findMany({
    orderBy: (fields, { desc }) => [desc(fields.ovr)],
    limit,
    with: {
      user: { columns: { id: true, name: true, username: true, image: true } },
      club: { columns: { name: true, tier: true, logo: true } },
    },
  });
}
