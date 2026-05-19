import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { username, admin } from "better-auth/plugins";
import { userStats } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: async (profile) => {
        return {
          username: profile.email.split("@")[0],
          displayUsername: profile.email.split("@")[0],
        };
      },
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID as string,
      clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
      mapProfileToUser: async (profile) => {
        return {
          username: profile.email.split("@")[0],
          displayUsername: profile.email.split("@")[0],
        };
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "twitch"],
    },
  },
  user: {
    additionalFields: {
      bio: {
        type: "string",
        required: false,
        defaultValue: "",
        input: true,
      },
    },
  },
  plugins: [username(), admin()],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await db.insert(userStats).values({
              userId: user.id,
            });
            console.log(
              `Stats inicializados para el usuario: ${user.username}`,
            );
          } catch (error) {
            console.error("Error inicializando stats del usuario:", error);
          }
        },
      },
    },
  },
});
