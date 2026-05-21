import { db } from "@/db";
import { match, prediction, userStats } from "@/db/schema";
import { getPastMatches } from "@/lib/sportsdb";
import { calculatePointsWon } from "@/lib/odds";
import { eq, and, inArray } from "drizzle-orm";

async function syncResults() {
  console.log("🔄 Sincronizando resultados...");

  const pastRes = await getPastMatches();

  if (!pastRes.events) {
    console.log("⚠️ No hay partidos recientes");
    return;
  }

  const apiIds = pastRes.events.map((e) => Number(e.idEvent));

  const pendingMatches = await db
    .select()
    .from(match)
    .where(and(inArray(match.apiId, apiIds), eq(match.status, "scheduled")));

  if (pendingMatches.length === 0) {
    console.log("✅ No hay partidos pendientes de actualizar");
    return;
  }

  console.log(`📋 ${pendingMatches.length} partidos para actualizar`);

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

    console.log(
      `✅ ${event.strHomeTeam} ${homeScore} - ${awayScore} ${event.strAwayTeam}`,
    );

    const predictions = await db
      .select()
      .from(prediction)
      .where(eq(prediction.matchId, dbMatch.id));

    if (predictions.length === 0) continue;

    console.log(`   👥 ${predictions.length} predicciones a validar`);

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
        .set({
          isCorrect,
          pointsWon,
        })
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

      console.log(
        `   ${isCorrect ? "✅" : "❌"} User ${pred.userId}: ${isCorrect ? `+${pointsWon} pts` : "0 pts"}`,
      );
    }
  }

  console.log("\n✅ Sync de resultados completado");
}

syncResults();
