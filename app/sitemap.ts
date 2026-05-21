import { MetadataRoute } from "next";
import { db } from "@/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://cabala.app";

  const users = await db.query.user.findMany({
    columns: { username: true, updatedAt: true },
    where: (user, { isNotNull }) => isNotNull(user.username),
  });

  const profileUrls = users.map((u) => ({
    url: `${baseUrl}/profile/${u.username}`,
    lastModified: u.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

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
    ...profileUrls,
  ];
}
