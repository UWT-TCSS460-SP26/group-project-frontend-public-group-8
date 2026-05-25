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
            __html: `(function(){var s=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(s!=='light'&&p)){document.documentElement.setAttribute('data-theme','dark');}})();`,
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
