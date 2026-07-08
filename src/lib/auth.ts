import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user?: DefaultSession["user"] & {
      login?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    login?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user read:org",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile && typeof profile === "object" && "login" in profile) {
        token.login = typeof profile.login === "string" ? profile.login : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      if (session.user) {
        session.user.login = token.login;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
