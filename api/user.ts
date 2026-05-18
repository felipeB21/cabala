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
    },
  });

  return result ?? null;
}
