import { db } from "@/db";
import { team } from "@/db/schema";

interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string | null;
  strBadge: string | null;
  strCountry: string | null;
}

interface SportsDBTeamsResponse {
  teams: SportsDBTeam[] | null;
}

async function seedTeams() {
  const res = await fetch(
    `${process.env.SPORTSDB_API}/search_all_teams.php?l=Argentinian+Primera+Division`,
  );

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data: SportsDBTeamsResponse = await res.json();

  if (!data.teams) {
    throw new Error("No teams returned from API");
  }

  const teams = data.teams.map((t) => ({
    id: Number(t.idTeam),
    apiId: Number(t.idTeam),
    name: t.strTeam,
    shortName: t.strTeamShort ?? null,
    logo: t.strBadge ?? null,
    country: t.strCountry ?? "Argentina",
  }));

  await db.insert(team).values(teams).onConflictDoNothing();

  console.log(`✅ ${teams.length} equipos insertados`);
}

seedTeams();
