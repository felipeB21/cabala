import { db } from "@/db";
import { match, team } from "@/db/schema";
import {
  getUpcomingMatches,
  getPastMatches,
  getLeagueTable,
  getTeamById,
} from "@/lib/sportsdb";
import { calculateMatchOdds, type TeamForm } from "@/lib/odds";
import type { SportsDBEvent, SportsDBTable } from "@/types/sportsdb";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

async function ensureTeamExists(apiId: string): Promise<boolean> {
  const existing = await db
    .select()
    .from(team)
    .where(eq(team.apiId, Number(apiId)))
    .limit(1);

  if (existing.length > 0) return true;

  const res = await getTeamById(apiId);
  if (!res.teams?.[0]) {
    console.warn(`⚠️ No se encontró el equipo con apiId ${apiId}`);
    return false;
  }

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

  console.log(`➕ Equipo insertado: ${t.strTeam}`);
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

      if (homeScore === awayScore) {
        form.draws++;
      } else if (isHome ? homeScore > awayScore : awayScore > homeScore) {
        form.wins++;
      } else {
        form.losses++;
      }
    }

    formMap.set(teamId, form);
  }

  return formMap;
}

function parseStartsAt(dateEvent: string, strTime: string): Date {
  return new Date(`${dateEvent}T${strTime}Z`);
}

async function syncMatches() {
  console.log("🔄 Sincronizando partidos...");

  const [nextRes, pastRes, tableRes] = await Promise.all([
    getUpcomingMatches(),
    getPastMatches(),
    getLeagueTable(),
  ]);

  if (!nextRes.events) {
    console.log("⚠️ No hay próximos partidos");
    return;
  }

  if (!tableRes.table) {
    throw new Error("No se pudo obtener la tabla de posiciones");
  }

  console.log(`⚽ ${nextRes.events.length} partidos encontrados`);

  const pastEvents = pastRes.events ?? [];
  const formMap = buildFormMap(pastEvents);

  const tableMap = new Map<string, SportsDBTable>(
    tableRes.table.map((t) => [t.idTeam, t]),
  );

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

  let inserted = 0;
  let skipped = 0;

  for (const event of nextRes.events) {
    const homeTable = tableMap.get(event.idHomeTeam) ?? defaultTable;
    const awayTable = tableMap.get(event.idAwayTeam) ?? defaultTable;
    const homeForm = formMap.get(event.idHomeTeam) ?? defaultForm;
    const awayForm = formMap.get(event.idAwayTeam) ?? defaultForm;

    const homeExists = await ensureTeamExists(event.idHomeTeam);
    const awayExists = await ensureTeamExists(event.idAwayTeam);

    if (!homeExists || !awayExists) {
      console.warn(
        `⚠️ Skipping ${event.strHomeTeam} vs ${event.strAwayTeam}: equipo faltante`,
      );
      skipped++;
      continue;
    }

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

      console.log(`✅ ${event.strHomeTeam} vs ${event.strAwayTeam}`);
      inserted++;
    } catch (err) {
      console.warn(
        `⚠️ Skipped ${event.strHomeTeam} vs ${event.strAwayTeam}:`,
        err,
      );
      skipped++;
    }
  }

  console.log(`\n✅ ${inserted} partidos insertados, ${skipped} skipped`);
}

syncMatches();
