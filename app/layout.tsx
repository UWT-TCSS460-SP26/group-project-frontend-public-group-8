import type { Metadata } from "next"
import Header from "@/components/Header"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "Group 8 — TCSS 460",
  description: "TCSS 460 Group 8 consumer frontend",
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
            __html: `(function(){try{var s=localStorage.getItem('theme');var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.setAttribute('data-theme', s || (m?'light':'dark'));}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
