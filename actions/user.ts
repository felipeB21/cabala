"use server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

export async function getUserByUsername(username: string) {
  if (!username) return null;

  const result = await db.query.user.findFirst({
    where: eq(user.username, username),
    with: {
      stats: true,
      predictions: {
        orderBy: (prediction, { desc }) => [desc(prediction.createdAt)],
        limit: 10,
        with: {
          match: {
            with: {
              homeTeam: true,
              awayTeam: true,
            },
          },
        },
      },
    },
  });

  return result ?? null;
}

export async function getLeaderboard() {
  const result = await db.query.userStats.findMany({
    orderBy: (userStats, { desc }) => [desc(userStats.points)],
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

  return result;
}

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];

  const result = await db.query.user.findMany({
    where: (user, { or, ilike }) =>
      or(ilike(user.name, `%${query}%`), ilike(user.username, `%${query}%`)),
    limit: 5,
    columns: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
    with: {
      stats: {
        columns: {
          points: true,
          correctPredictions: true,
        },
      },
    },
  });

  return result;
}
