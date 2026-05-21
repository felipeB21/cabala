"use server";

import { db } from "@/db";
import { match, team, prediction } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, and, desc } from "drizzle-orm";

export interface MatchWithTeams {
  id: string;
  apiId: number;
  startsAt: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  isDraw: boolean;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  homeTeam: {
    id: number;
    name: string;
    shortName: string | null;
    logo: string | null;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string | null;
    logo: string | null;
  };
  userPrediction: "home" | "draw" | "away" | null;
}

export async function getScheduledMatches(): Promise<MatchWithTeams[]> {
  const session = await getSession();

  const userId = session?.user?.id ?? null;

  const homeTeam = db.select().from(team).as("home_team");

  const awayTeam = db.select().from(team).as("away_team");

  const matches = await db
    .select({
      id: match.id,
      apiId: match.apiId,
      startsAt: match.startsAt,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      isDraw: match.isDraw,
      homeOdds: match.homeOdds,
      drawOdds: match.drawOdds,
      awayOdds: match.awayOdds,
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        shortName: homeTeam.shortName,
        logo: homeTeam.logo,
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        shortName: awayTeam.shortName,
        logo: awayTeam.logo,
      },
    })
    .from(match)
    .innerJoin(homeTeam, eq(match.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(match.awayTeamId, awayTeam.id))
    .where(eq(match.status, "scheduled"))
    .orderBy(match.startsAt);

  if (matches.length === 0) return [];

  if (!userId) {
    return matches.map((m) => ({ ...m, userPrediction: null }));
  }

  const predictions = await db
    .select({
      matchId: prediction.matchId,
      prediction: prediction.prediction,
    })
    .from(prediction)
    .where(and(eq(prediction.userId, userId)));

  const predictionMap = new Map(
    predictions.map((p) => [p.matchId, p.prediction]),
  );

  return matches.map((m) => ({
    ...m,
    userPrediction: (predictionMap.get(m.id) ?? null) as
      | "home"
      | "draw"
      | "away"
      | null,
  }));
}

export async function getFinishedMatches(): Promise<MatchWithTeams[]> {
  const session = await getSession();

  const userId = session?.user?.id ?? null;

  const homeTeam = db.select().from(team).as("home_team");
  const awayTeam = db.select().from(team).as("away_team");

  const matches = await db
    .select({
      id: match.id,
      apiId: match.apiId,
      startsAt: match.startsAt,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      isDraw: match.isDraw,
      homeOdds: match.homeOdds,
      drawOdds: match.drawOdds,
      awayOdds: match.awayOdds,
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        shortName: homeTeam.shortName,
        logo: homeTeam.logo,
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        shortName: awayTeam.shortName,
        logo: awayTeam.logo,
      },
    })
    .from(match)
    .innerJoin(homeTeam, eq(match.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(match.awayTeamId, awayTeam.id))
    .where(eq(match.status, "finished"))
    .orderBy(desc(match.startsAt));

  if (matches.length === 0) return [];

  if (!userId) {
    return matches.map((m) => ({ ...m, userPrediction: null }));
  }

  const predictions = await db
    .select({
      matchId: prediction.matchId,
      prediction: prediction.prediction,
    })
    .from(prediction)
    .where(eq(prediction.userId, userId));

  const predictionMap = new Map(
    predictions.map((p) => [p.matchId, p.prediction]),
  );

  return matches.map((m) => ({
    ...m,
    userPrediction: (predictionMap.get(m.id) ?? null) as
      | "home"
      | "draw"
      | "away"
      | null,
  }));
}

export async function getMatchById(id: string): Promise<MatchWithTeams | null> {
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  const homeTeam = db.select().from(team).as("home_team");
  const awayTeam = db.select().from(team).as("away_team");

  const matches = await db
    .select({
      id: match.id,
      apiId: match.apiId,
      startsAt: match.startsAt,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      isDraw: match.isDraw,
      homeOdds: match.homeOdds,
      drawOdds: match.drawOdds,
      awayOdds: match.awayOdds,
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        shortName: homeTeam.shortName,
        logo: homeTeam.logo,
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        shortName: awayTeam.shortName,
        logo: awayTeam.logo,
      },
    })
    .from(match)
    .innerJoin(homeTeam, eq(match.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(match.awayTeamId, awayTeam.id))
    .where(eq(match.id, id))
    .limit(1);

  if (matches.length === 0) return null;

  if (!userId) return { ...matches[0], userPrediction: null };

  const predictions = await db
    .select({ matchId: prediction.matchId, prediction: prediction.prediction })
    .from(prediction)
    .where(and(eq(prediction.userId, userId), eq(prediction.matchId, id)));

  const userPrediction = predictions[0]?.prediction ?? null;

  return {
    ...matches[0],
    userPrediction: userPrediction as "home" | "draw" | "away" | null,
  };
}

export async function getMatchPredictionStats(matchId: string) {
  const predictions = await db
    .select({ prediction: prediction.prediction })
    .from(prediction)
    .where(eq(prediction.matchId, matchId));

  const total = predictions.length;
  if (total === 0) return { home: 0, draw: 0, away: 0, total: 0 };

  const counts = { home: 0, draw: 0, away: 0 };
  for (const p of predictions) {
    counts[p.prediction as keyof typeof counts]++;
  }

  return {
    home: Math.round((counts.home / total) * 100),
    draw: Math.round((counts.draw / total) * 100),
    away: Math.round((counts.away / total) * 100),
    total,
  };
}

export async function getMatchComments(matchId: string) {
  return db.query.matchComment.findMany({
    where: (matchComment, { eq }) => eq(matchComment.matchId, matchId),
    orderBy: (matchComment, { desc }) => [desc(matchComment.createdAt)],
    limit: 50,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  });
}
