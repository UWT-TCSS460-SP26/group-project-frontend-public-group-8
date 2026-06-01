import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string
    authorId?: number
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string
    authorId?: number
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://tcss-460-group-7.onrender.com'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch {
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: "tcss460",
      name: "TCSS 460",
      type: "oidc",
      issuer: "https://tcss-460-iam.onrender.com",
      clientId: process.env.AUTH_TCSS460_CLIENT_ID,
      clientSecret: process.env.AUTH_TCSS460_CLIENT_SECRET,
      authorization: {
        params: {
          audience: "group-7-api",
        },
      },
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token
        // Sync user with the API to obtain the database authorId
        try {
          const claims = decodeJwtPayload(account.access_token)
          const username =
            (claims?.preferred_username as string) ??
            (claims?.email as string)?.split('@')[0] ??
            (claims?.sub as string)
          const email =
            (claims?.email as string) ?? `${claims?.sub}@unknown.local`
          const display_name = (profile?.name as string) ?? null

          const res = await fetch(`${API_BASE}/v1/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${account.access_token}`,
            },
            body: JSON.stringify({ username, email, display_name }),
          })
          if (res.ok) {
            const user = await res.json()
            token.authorId = user.id as number
          }
        } catch { /* continue without authorId */ }
      }
      return token
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.authorId = token.authorId as number | undefined
      return session
    },
  },
})
