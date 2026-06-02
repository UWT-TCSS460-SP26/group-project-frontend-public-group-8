import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [], // Providers are fully configured in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnProfile = nextUrl.pathname.startsWith('/profile')
      
      if (isOnProfile) {
        return isLoggedIn
      }
      
      return true
    },
  },
} satisfies NextAuthConfig
