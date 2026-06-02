import type { Metadata } from "next"
import { SessionProvider } from "next-auth/react"
import Header from "@/components/Header"
import TokenExpiryWatcher from "@/components/TokenExpiryWatcher"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "Screen8",
  description: "Discover, rate, and review movies and TV shows",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function a(){var s=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(s!=='light'&&p)){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.removeAttribute('data-theme');}}a();window.addEventListener('pageshow',function(e){if(e.persisted)a();});})();`,
          }}
        />
      </head>
      <body>
        <SessionProvider>
          <TokenExpiryWatcher />
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
