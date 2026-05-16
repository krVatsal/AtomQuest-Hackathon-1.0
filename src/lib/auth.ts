import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

import type { Role } from "@/generated/prisma";

const GRAPH = "https://graph.microsoft.com/v1.0";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      managerId: string | null;
    };
  }

  interface User {
    role: Role;
    managerId: string | null;
  }
}

declare module "next-auth" {
  interface JWT {
    id: string;
    role: Role;
    managerId: string | null;
  }
}

async function syncAzureUser(
  email: string,
  name: string,
  accessToken: string
): Promise<{ id: string; role: Role; managerId: string | null }> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Resolve role from AD group membership
  let role: Role = "EMPLOYEE";
  try {
    const res = await fetch(`${GRAPH}/me/memberOf?$select=displayName`, { headers });
    if (res.ok) {
      const data = await res.json();
      const groups: string[] = (data.value ?? []).map((g: { displayName: string }) => g.displayName);
      if (groups.includes("GoalPortal-Admins")) role = "ADMIN";
      else if (groups.includes("GoalPortal-Managers")) role = "MANAGER";
    }
  } catch {
    // Non-fatal; default role applies
  }

  // Resolve managerId from AD manager attribute
  let managerId: string | null = null;
  try {
    const res = await fetch(`${GRAPH}/me/manager?$select=mail`, { headers });
    if (res.ok) {
      const data = await res.json();
      const managerEmail: string | undefined = data.mail;
      if (managerEmail) {
        const managerRecord = await prisma.user.findUnique({
          where: { email: managerEmail },
          select: { id: true },
        });
        managerId = managerRecord?.id ?? null;
      }
    }
  } catch {
    // Non-fatal; manager stays null
  }

  // Upsert the user record
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, password: "", role, managerId },
    update: { name, role, managerId },
    select: { id: true, role: true, managerId: true },
  });

  return user;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          managerId: user.managerId,
        };
      },
    }),
    MicrosoftEntraId({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: process.env.AZURE_AD_TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`
        : "https://login.microsoftonline.com/common/v2.0",
      authorization: {
        params: {
          scope: "openid profile email User.Read GroupMember.Read.All",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "microsoft-entra-id" && account.access_token) {
        const email = profile?.email ?? (profile as Record<string, string>)?.preferred_username;
        const name = profile?.name ?? email ?? "Unknown";
        if (email) {
          await syncAzureUser(email, name, account.access_token as string);
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user) {
        // Credentials: user object already has role/managerId
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.managerId = (user as { managerId: string | null }).managerId;
      } else if (account?.provider === "microsoft-entra-id" && token.email) {
        // Azure AD: look up the freshly-synced record
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true, managerId: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.managerId = dbUser.managerId;
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.managerId = token.managerId as string | null;
      return session;
    },
  },
});
