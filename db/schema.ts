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

    startsAt: timestamp("starts_at").notNull(),

    status: text("status").notNull(),
    // scheduled | live | finished

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
   RELATIONS
========================= */

export const userRelations = relations(user, ({ many, one }) => ({
  stats: one(userStats, {
    fields: [user.id],
    references: [userStats.userId],
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
