"use server";
import { db } from "@/db";

export async function searchMatches(query: string) {
  if (!query || query.length < 2) return [];

  const teams = await db.query.team.findMany({
    where: (team, { ilike }) => ilike(team.name, `%${query}%`),
    columns: { id: true },
  });

  if (teams.length === 0) return [];

  const teamIds = teams.map((t) => t.id);

  return db.query.match.findMany({
    where: (match, { or, inArray }) =>
      or(
        inArray(match.homeTeamId, teamIds),
        inArray(match.awayTeamId, teamIds),
      ),
    orderBy: (match, { desc }) => [desc(match.startsAt)],
    limit: 10,
    columns: {
      id: true,
      slug: true,
      status: true,
      homeScore: true,
      awayScore: true,
      startsAt: true,
    },
    with: {
      homeTeam: {
        columns: { id: true, name: true, shortName: true, logo: true },
      },
      awayTeam: {
        columns: { id: true, name: true, shortName: true, logo: true },
      },
    },
  });
}
