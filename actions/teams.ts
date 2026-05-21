"use server";

import { db } from "@/db";

export async function searchTeams(query: string) {
  if (!query || query.length < 2) return [];

  const result = await db.query.team.findMany({
    where: (team, { ilike }) => ilike(team.name, `%${query}%`),
    limit: 5,
    columns: {
      id: true,
      name: true,
      shortName: true,
      logo: true,
    },
  });

  return result;
}
