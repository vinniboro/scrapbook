import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { cloudDevEnabled } from "@/lib/db-cloud";
import { getDb } from "@/lib/db";
import { finishNewUser } from "@/lib/users";

function createAdapter() {
  return DrizzleAdapter(getDb() as never, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  } as never);
}

function hasPersistedDatabase() {
  return Boolean(process.env.DATABASE_URL) || cloudDevEnabled();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: hasPersistedDatabase() ? createAdapter() : undefined,
  session: { strategy: hasPersistedDatabase() ? "database" : "jwt" },
  trustHost: true,
  providers: [Google],
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await finishNewUser(getDb(), {
        id: user.id,
        name: user.name,
        email: user.email,
      });
    },
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      const row = user as {
        handle?: string | null;
        onboardedAt?: Date | null;
      };
      session.user.handle = row.handle ?? null;
      session.user.onboardedAt = row.onboardedAt
        ? row.onboardedAt.toISOString()
        : null;
      return session;
    },
  },
});
