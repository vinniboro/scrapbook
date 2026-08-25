import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      handle: string | null;
      onboardedAt: string | null;
    };
  }
}
