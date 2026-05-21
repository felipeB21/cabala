"use server";

import { db } from "@/db";
import { prediction, match, userStats } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/session";

type PredictionValue = "home" | "draw" | "away";

interface CreatePredictionInput {
  matchId: string;
  prediction: PredictionValue;
  content?: string;
}

interface CreatePredictionResult {
  success: boolean;
  error?: string;
}

export async function createPrediction(
  input: CreatePredictionInput,
): Promise<CreatePredictionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "No autenticado" };
  }

  const userId = session.user.id;

  const matches = await db
    .select()
    .from(match)
    .where(eq(match.id, input.matchId))
    .limit(1);

  if (matches.length === 0) {
    return { success: false, error: "Partido no encontrado" };
  }

  const currentMatch = matches[0];

  if (currentMatch.status !== "scheduled") {
    return { success: false, error: "El partido ya comenzó o terminó" };
  }

  if (new Date() >= currentMatch.startsAt) {
    return { success: false, error: "El partido ya comenzó" };
  }

  const existing = await db
    .select()
    .from(prediction)
    .where(
      and(eq(prediction.userId, userId), eq(prediction.matchId, input.matchId)),
    )
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: "Ya predijiste este partido" };
  }

  await db.insert(prediction).values({
    id: randomUUID(),
    userId,
    matchId: input.matchId,
    prediction: input.prediction,
    content: input.content ?? null,
    pointsWon: 0,
    isCorrect: null,
  });

  await db
    .insert(userStats)
    .values({
      userId,
      points: 0,
      correctPredictions: 0,
      wrongPredictions: 0,
      streak: 0,
    })
    .onConflictDoNothing();

  return { success: true };
}

export async function getUserPredictionForMatch(
  matchId: string,
): Promise<PredictionValue | null> {
  const session = await getSession();

  if (!session?.user) return null;

  const predictions = await db
    .select()
    .from(prediction)
    .where(
      and(
        eq(prediction.userId, session.user.id),
        eq(prediction.matchId, matchId),
      ),
    )
    .limit(1);

  if (predictions.length === 0) return null;

  return predictions[0].prediction as PredictionValue;
}
