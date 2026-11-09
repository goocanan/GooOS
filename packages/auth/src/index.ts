import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "@gooos/db";
import crypto from "crypto";

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "gooos-studio-production-auth-secret-key-must-be-at-least-32-chars",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.PORT ? `http://0.0.0.0:${process.env.PORT}` : "http://0.0.0.0:10000"),
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    debugLogs: false,
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              // Any new registrant is assigned limited trial access
              title: user.title || "member_limited",
            },
          };
        },
        after: async (user) => {
          try {
            const workspaceId = "ws_3817e3eb6c344c4da519";
            await db
              .insert(schema.workspaceMembers)
              .values({
                id: crypto.randomUUID(),
                workspaceId,
                userId: user.id,
                role: "creator",
              })
              .onConflictDoNothing();
          } catch (err) {
            console.error("Failed to enroll new user to workspace:", err);
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // update every 24h
  },
});

export type Auth = typeof auth;
