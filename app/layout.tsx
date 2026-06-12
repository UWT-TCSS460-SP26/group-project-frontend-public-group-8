import type { Metadata } from "next"
import { SessionProvider } from "next-auth/react"
import Header from "@/components/Header"
import TokenExpiryWatcher from "@/components/TokenExpiryWatcher"
import { Orbitron } from "next/font/google"
import { MediaProvider } from "@/lib/MediaContext"
import "@/styles/globals.css"

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-orbitron",
  display: "swap",
})

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
    <html lang="en" suppressHydrationWarning className={orbitron.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function a(){try{var s=localStorage.getItem('theme');var p=window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches;if(s==='light'||(s!=='dark'&&p)){document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.removeAttribute('data-theme');}}catch(e){}}a();window.addEventListener('pageshow',function(e){if(e.persisted)a();});})();`,
          }}
        />
      </head>
      <body>
        <MediaProvider>
          <SessionProvider>
            <TokenExpiryWatcher />
            <Header />
            {children}
          </SessionProvider>
        </MediaProvider>
      </body>
    </html>
  )
}
