import { getLeaderboard } from "@/actions/user";
import { LeaderboardClient } from "@/components/leaderboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Los mejores predictores de fútbol argentino. ¿Podés llegar al top?",
};

export default async function LeaderboardPage() {
  const users = await getLeaderboard();

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Ranking</h1>
        <p className="text-sm text-muted-foreground">
          Los mejores predictores de la temporada
        </p>
      </div>
      <LeaderboardClient users={users} />
    </main>
  );
}
