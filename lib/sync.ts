import { db } from "@/db";
import { match, team, prediction, userStats } from "@/db/schema";
import {
  getUpcomingMatches,
  getPastMatches,
  getLeagueTable,
  getTeamById,
} from "@/lib/sportsdb";
import {
  calculateMatchOdds,
  calculatePointsWon,
  type TeamForm,
} from "@/lib/odds";
import type { SportsDBEvent, SportsDBTable } from "@/types/sportsdb";
import { randomUUID } from "crypto";
import { eq, and, inArray } from "drizzle-orm";

async function ensureTeamExists(apiId: string): Promise<boolean> {
  const existing = await db
    .select()
    .from(team)
    .where(eq(team.apiId, Number(apiId)))
    .limit(1);

  if (existing.length > 0) return true;

  const res = await getTeamById(apiId);
  if (!res.teams?.[0]) return false;

  const t = res.teams[0];
  await db
    .insert(team)
    .values({
      id: Number(t.idTeam),
      apiId: Number(t.idTeam),
      name: t.strTeam,
      shortName: t.strTeamShort ?? null,
      logo: t.strBadge ?? null,
      country: t.strCountry ?? "Argentina",
    })
    .onConflictDoNothing();

  return true;
}

function buildFormMap(pastEvents: SportsDBEvent[]): Map<string, TeamForm> {
  const formMap = new Map<string, TeamForm>();
  const sorted = [...pastEvents].sort(
    (a, b) => new Date(b.dateEvent).getTime() - new Date(a.dateEvent).getTime(),
  );
  const teamGames = new Map<string, SportsDBEvent[]>();

  for (const event of sorted) {
    const home = event.idHomeTeam;
    const away = event.idAwayTeam;
    if (!teamGames.has(home)) teamGames.set(home, []);
    if (!teamGames.has(away)) teamGames.set(away, []);
    const homeGames = teamGames.get(home)!;
    const awayGames = teamGames.get(away)!;
    if (homeGames.length < 5) homeGames.push(event);
    if (awayGames.length < 5) awayGames.push(event);
  }

  for (const [teamId, games] of teamGames.entries()) {
    const form: TeamForm = { wins: 0, draws: 0, losses: 0 };
    for (const game of games) {
      const homeScore = Number(game.intHomeScore ?? 0);
      const awayScore = Number(game.intAwayScore ?? 0);
      const isHome = game.idHomeTeam === teamId;
      if (homeScore === awayScore) form.draws++;
      else if (isHome ? homeScore > awayScore : awayScore > homeScore)
        form.wins++;
      else form.losses++;
    }
    formMap.set(teamId, form);
  }

  return formMap;
}

function parseStartsAt(dateEvent: string, strTime: string): Date {
  return new Date(`${dateEvent}T${strTime}Z`);
}

const defaultForm: TeamForm = { wins: 1, draws: 1, losses: 1 };
const defaultTable: SportsDBTable = {
  idTeam: "",
  strTeam: "",
  intRank: "15",
  intWin: "0",
  intDraw: "0",
  intLoss: "0",
  intPoints: "0",
  intGoalsFor: "0",
  intGoalsAgainst: "0",
};

export async function syncMatches(): Promise<{
  inserted: number;
  skipped: number;
}> {
  const [nextRes, pastRes, tableRes] = await Promise.all([
    getUpcomingMatches(),
    getPastMatches(),
    getLeagueTable(),
  ]);

  if (!nextRes.events) return { inserted: 0, skipped: 0 };
  if (!tableRes.table)
    throw new Error("No se pudo obtener la tabla de posiciones");

  const pastEvents = pastRes.events ?? [];
  const formMap = buildFormMap(pastEvents);
  const tableMap = new Map<string, SportsDBTable>(
    tableRes.table.map((t) => [t.idTeam, t]),
  );

  let inserted = 0;
  let skipped = 0;

  for (const event of nextRes.events) {
    const homeExists = await ensureTeamExists(event.idHomeTeam);
    const awayExists = await ensureTeamExists(event.idAwayTeam);

    if (!homeExists || !awayExists) {
      skipped++;
      continue;
    }

    const homeTable = tableMap.get(event.idHomeTeam) ?? defaultTable;
    const awayTable = tableMap.get(event.idAwayTeam) ?? defaultTable;
    const homeForm = formMap.get(event.idHomeTeam) ?? defaultForm;
    const awayForm = formMap.get(event.idAwayTeam) ?? defaultForm;

    const { homeOdds, drawOdds, awayOdds } = calculateMatchOdds(
      homeTable,
      awayTable,
      homeForm,
      awayForm,
    );

    try {
      await db
        .insert(match)
        .values({
          id: randomUUID(),
          apiId: Number(event.idEvent),
          homeTeamId: Number(event.idHomeTeam),
          awayTeamId: Number(event.idAwayTeam),
          startsAt: parseStartsAt(event.dateEvent, event.strTime),
          status: "scheduled",
          homeScore: null,
          awayScore: null,
          winnerTeamId: null,
          isDraw: false,
          homeOdds,
          drawOdds,
          awayOdds,
        })
        .onConflictDoNothing();
      inserted++;
    } catch {
      skipped++;
    }
  }

  return { inserted, skipped };
}

export async function syncResults(): Promise<{ updated: number }> {
  const pastRes = await getPastMatches();
  if (!pastRes.events) return { updated: 0 };

  const apiIds = pastRes.events.map((e) => Number(e.idEvent));
  const pendingMatches = await db
    .select()
    .from(match)
    .where(and(inArray(match.apiId, apiIds), eq(match.status, "scheduled")));

  if (pendingMatches.length === 0) return { updated: 0 };

  let updated = 0;

  for (const dbMatch of pendingMatches) {
    const event = pastRes.events.find(
      (e) => Number(e.idEvent) === dbMatch.apiId,
    );
    if (!event) continue;

    const homeScore = Number(event.intHomeScore ?? 0);
    const awayScore = Number(event.intAwayScore ?? 0);
    const isDraw = homeScore === awayScore;
    const winnerTeamId = isDraw
      ? null
      : homeScore > awayScore
        ? dbMatch.homeTeamId
        : dbMatch.awayTeamId;
    const correctPrediction = isDraw
      ? "draw"
      : winnerTeamId === dbMatch.homeTeamId
        ? "home"
        : "away";

    await db
      .update(match)
      .set({
        status: "finished",
        homeScore,
        awayScore,
        isDraw,
        winnerTeamId,
      })
      .where(eq(match.id, dbMatch.id));

    const predictions = await db
      .select()
      .from(prediction)
      .where(eq(prediction.matchId, dbMatch.id));

    for (const pred of predictions) {
      const isCorrect = pred.prediction === correctPrediction;
      const odds = isCorrect
        ? pred.prediction === "home"
          ? dbMatch.homeOdds
          : pred.prediction === "away"
            ? dbMatch.awayOdds
            : dbMatch.drawOdds
        : 0;
      const pointsWon = isCorrect ? calculatePointsWon(odds) : 0;

      await db
        .update(prediction)
        .set({ isCorrect, pointsWon })
        .where(eq(prediction.id, pred.id));

      const stats = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, pred.userId))
        .limit(1);
      if (stats.length === 0) continue;

      const current = stats[0];
      await db
        .update(userStats)
        .set({
          points: current.points + pointsWon,
          correctPredictions: isCorrect
            ? current.correctPredictions + 1
            : current.correctPredictions,
          wrongPredictions: !isCorrect
            ? current.wrongPredictions + 1
            : current.wrongPredictions,
          streak: isCorrect ? current.streak + 1 : 0,
        })
        .where(eq(userStats.userId, pred.userId));
    }

    updated++;
  }

  return { updated };
}
