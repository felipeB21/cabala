import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

/* =========================
   AUTH
========================= */

export const user = pgTable("user", {
  id: text("id").primaryKey(),

  username: text("username").unique(),
  displayUsername: text("display_username"),

  name: text("name").notNull(),

  email: text("email").notNull().unique(),

  emailVerified: boolean("email_verified").default(false).notNull(),

  image: text("image"),

  bio: text("bio"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { precision: 6, withTimezone: true }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const userStats = pgTable(
  "user_stats",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),

    points: integer("points").default(0).notNull(),
    correctPredictions: integer("correct_predictions").default(0).notNull(),
    wrongPredictions: integer("wrong_predictions").default(0).notNull(),
    streak: integer("streak").default(0).notNull(),
  },
  (table) => [index("user_stats_points_idx").on(table.points)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),

    expiresAt: timestamp("expires_at").notNull(),

    token: text("token").notNull().unique(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),

    ipAddress: text("ip_address"),
    impersonatedBy: text("impersonated_by"),
    userAgent: text("user_agent"),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),

    accountId: text("account_id").notNull(),

    providerId: text("provider_id").notNull(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    accessToken: text("access_token"),

    refreshToken: text("refresh_token"),

    idToken: text("id_token"),

    accessTokenExpiresAt: timestamp("access_token_expires_at"),

    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),

    scope: text("scope"),

    password: text("password"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),

    identifier: text("identifier").notNull(),

    value: text("value").notNull(),

    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/* =========================
   TEAMS
========================= */

export const team = pgTable("team", {
  id: integer("id").primaryKey(),

  apiId: integer("api_id").unique().notNull(),

  name: text("name").notNull(),

  shortName: text("short_name"),

  logo: text("logo"),

  country: text("country"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================
   MATCHES
========================= */

export const match = pgTable(
  "match",
  {
    id: text("id").primaryKey(),

    apiId: integer("api_id").unique().notNull(),

    homeTeamId: integer("home_team_id")
      .notNull()
      .references(() => team.id),

    awayTeamId: integer("away_team_id")
      .notNull()
      .references(() => team.id),
    slug: text("slug").unique(),
    competition: text("competition").notNull().default("liga"),
    startsAt: timestamp("starts_at").notNull(),

    status: text("status").notNull(),

    homeScore: integer("home_score"),

    awayScore: integer("away_score"),

    winnerTeamId: integer("winner_team_id").references(() => team.id),

    isDraw: boolean("is_draw").default(false).notNull(),

    /*
      Odds/puntos base.

      Ej:
      River vs Riestra

      homeOdds = 1.20
      drawOdds = 4.50
      awayOdds = 8.90
    */

    homeOdds: integer("home_odds").notNull(),

    drawOdds: integer("draw_odds").notNull(),

    awayOdds: integer("away_odds").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("match_homeTeamId_idx").on(table.homeTeamId),

    index("match_awayTeamId_idx").on(table.awayTeamId),

    index("match_status_idx").on(table.status),
  ],
);

/* =========================
   PREDICTIONS
========================= */

export const prediction = pgTable(
  "prediction",
  {
    id: text("id").primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    matchId: text("match_id")
      .notNull()
      .references(() => match.id, {
        onDelete: "cascade",
      }),

    prediction: text("prediction").notNull(),

    pointsWon: integer("points_won").default(0).notNull(),

    isCorrect: boolean("is_correct"),

    content: text("content"),

    likesCount: integer("likes_count").default(0).notNull(),

    commentsCount: integer("comments_count").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("prediction_createdAt_idx").on(table.createdAt),
    uniqueIndex("prediction_user_match_unique").on(table.userId, table.matchId),

    index("prediction_matchId_idx").on(table.matchId),

    index("prediction_userId_idx").on(table.userId),
  ],
);

/* =========================
   PREDICTION LIKES
========================= */

export const predictionLike = pgTable(
  "prediction_like",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    predictionId: text("prediction_id")
      .notNull()
      .references(() => prediction.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.predictionId],
    }),
  ],
);

/* =========================
   COMMENTS
========================= */

export const predictionComment = pgTable(
  "prediction_comment",
  {
    id: text("id").primaryKey(),

    predictionId: text("prediction_id")
      .notNull()
      .references(() => prediction.id, {
        onDelete: "cascade",
      }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),

    content: text("content").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("prediction_comment_predictionId_idx").on(table.predictionId),
  ],
);

export const matchComment = pgTable(
  "match_comment",
  {
    id: text("id").primaryKey(),

    matchId: text("match_id")
      .notNull()
      .references(() => match.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    content: text("content").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("match_comment_matchId_idx").on(table.matchId),
    index("match_comment_userId_idx").on(table.userId),
  ],
);

/* =========================
   CAREER MODE
========================= */

export const careerClub = pgTable(
  "career_club",
  {
    id: text("id").primaryKey(),

    name: text("name").notNull(),

    nationality: text("nationality").notNull(),

    tier: text("tier").notNull(),

    logo: text("logo"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("career_club_nationality_idx").on(table.nationality)],
);

export const careerPlayer = pgTable("career_player", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),

  jerseyName: text("jersey_name").notNull(),

  squadNumber: integer("squad_number").notNull(),

  nationality: text("nationality").notNull(),

  position: text("position").notNull(),

  clubId: text("club_id")
    .notNull()
    .references(() => careerClub.id),

  // `ovr` is a cached readout of the 5 attributes below (see computeOvr in
  // lib/career.ts) — kept as a real column so leaderboard sorting stays a
  // plain `ORDER BY ovr` instead of computing it for every row.
  ovr: integer("ovr").default(60).notNull(),
  pace: integer("pace").default(60).notNull(),
  shooting: integer("shooting").default(60).notNull(),
  passing: integer("passing").default(60).notNull(),
  defending: integer("defending").default(60).notNull(),
  physical: integer("physical").default(60).notNull(),

  age: integer("age").default(17).notNull(),

  seasonNumber: integer("season_number").default(1).notNull(),
  matchesPlayedInSeason: integer("matches_played_in_season")
    .default(0)
    .notNull(),

  appearances: integer("appearances").default(0).notNull(),
  goals: integer("goals").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),

  energy: integer("energy").default(100).notNull(),
  morale: integer("morale").default(50).notNull(),
  teamReputation: integer("team_reputation").default(50).notNull(),
  fanReputation: integer("fan_reputation").default(50).notNull(),
  relationshipStatus: text("relationship_status").default("soltero").notNull(),
  suspended: boolean("suspended").default(false).notNull(),
  injuredMatchesRemaining: integer("injured_matches_remaining")
    .default(0)
    .notNull(),

  // JSON-serialized Trophy[] (see lib/career.ts) — a lightweight text column
  // rather than a relational table, since it's a small, append-only list.
  trophies: text("trophies").default("[]").notNull(),
  // JSON-serialized string[] of every club name the player has represented.
  clubsHistory: text("clubs_history").default("[]").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careerMatch = pgTable(
  "career_match",
  {
    id: text("id").primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => careerPlayer.userId, { onDelete: "cascade" }),

    seasonNumber: integer("season_number").notNull(),
    matchNumber: integer("match_number").notNull(),

    started: boolean("started").notNull(),
    rating: integer("rating"),
    goals: integer("goals").default(0).notNull(),
    assists: integer("assists").default(0).notNull(),
    redCard: boolean("red_card").default(false).notNull(),
    injured: boolean("injured").default(false).notNull(),
    ovrDelta: integer("ovr_delta").default(0).notNull(),
    ovrAfter: integer("ovr_after").notNull(),
    ageAtMatch: integer("age_at_match").notNull(),

    clubResult: text("club_result").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("career_match_userId_idx").on(table.userId),
    index("career_match_createdAt_idx").on(table.createdAt),
  ],
);

/* =========================
   RELATIONS
========================= */

export const userRelations = relations(user, ({ many, one }) => ({
  stats: one(userStats, {
    fields: [user.id],
    references: [userStats.userId],
  }),
  career: one(careerPlayer, {
    fields: [user.id],
    references: [careerPlayer.userId],
  }),
  sessions: many(session),

  accounts: many(account),

  predictions: many(prediction),

  predictionLikes: many(predictionLike),

  predictionComments: many(predictionComment),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const matchCommentRelations = relations(matchComment, ({ one }) => ({
  user: one(user, {
    fields: [matchComment.userId],
    references: [user.id],
  }),
  match: one(match, {
    fields: [matchComment.matchId],
    references: [match.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const teamRelations = relations(team, ({ many }) => ({
  homeMatches: many(match, { relationName: "home_team" }),
  awayMatches: many(match, { relationName: "away_team" }),
}));

export const matchRelations = relations(match, ({ one, many }) => ({
  homeTeam: one(team, {
    fields: [match.homeTeamId],
    references: [team.id],
    relationName: "home_team",
  }),

  awayTeam: one(team, {
    fields: [match.awayTeamId],
    references: [team.id],
    relationName: "away_team",
  }),

  predictions: many(prediction),
}));

export const predictionRelations = relations(prediction, ({ one, many }) => ({
  user: one(user, {
    fields: [prediction.userId],
    references: [user.id],
  }),

  match: one(match, {
    fields: [prediction.matchId],
    references: [match.id],
  }),

  likes: many(predictionLike),

  comments: many(predictionComment),
}));

export const predictionLikeRelations = relations(predictionLike, ({ one }) => ({
  user: one(user, {
    fields: [predictionLike.userId],
    references: [user.id],
  }),

  prediction: one(prediction, {
    fields: [predictionLike.predictionId],
    references: [prediction.id],
  }),
}));

export const predictionCommentRelations = relations(
  predictionComment,
  ({ one }) => ({
    user: one(user, {
      fields: [predictionComment.userId],
      references: [user.id],
    }),

    prediction: one(prediction, {
      fields: [predictionComment.predictionId],
      references: [prediction.id],
    }),
  }),
);

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(user, {
    fields: [userStats.userId],
    references: [user.id],
  }),
}));

export const careerClubRelations = relations(careerClub, ({ many }) => ({
  players: many(careerPlayer),
}));

export const careerPlayerRelations = relations(
  careerPlayer,
  ({ one, many }) => ({
    user: one(user, {
      fields: [careerPlayer.userId],
      references: [user.id],
    }),
    club: one(careerClub, {
      fields: [careerPlayer.clubId],
      references: [careerClub.id],
    }),
    matches: many(careerMatch),
  }),
);

export const careerMatchRelations = relations(careerMatch, ({ one }) => ({
  player: one(careerPlayer, {
    fields: [careerMatch.userId],
    references: [careerPlayer.userId],
  }),
}));
