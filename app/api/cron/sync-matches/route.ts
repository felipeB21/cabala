import { NextResponse } from "next/server";
import { syncMatches } from "@/lib/sync";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncMatches();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("sync-matches error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
