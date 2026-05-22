import { MetadataRoute } from "next";
import { db } from "@/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cabala.ar";

  const [users, matches] = await Promise.all([
    db.query.user.findMany({
      columns: { username: true, updatedAt: true },
      where: (user, { isNotNull }) => isNotNull(user.username),
    }),
    db.query.match.findMany({
      columns: { id: true, createdAt: true, status: true },
    }),
  ]);

  const profileUrls = users.map((u) => ({
    url: `${baseUrl}/profile/${u.username}`,
    lastModified: u.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  })) satisfies MetadataRoute.Sitemap;
  const matchUrls = matches.map((m) => ({
    url: `${baseUrl}/matches/${m.id}`,
    lastModified: m.createdAt,
    changeFrequency: m.status === "finished" ? "monthly" : "daily",
    priority: m.status === "finished" ? 0.5 : 0.8,
  })) satisfies MetadataRoute.Sitemap;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...matchUrls,
    ...profileUrls,
  ];
}
