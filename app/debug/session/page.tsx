import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DebugSessionPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/")
  }

  const session = await auth()

  return (
    <main style={{ padding: "1rem", fontFamily: "monospace" }}>
      <h1>Debug: Session</h1>
      <h2>Session object</h2>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "1rem",
          overflow: "auto",
          borderRadius: "4px",
        }}
      >
        {JSON.stringify(session, null, 2)}
      </pre>

      {session?.accessToken && (
        <>
          <h2>Access Token — paste into jwt.io to inspect</h2>
          <p style={{ fontSize: "0.8rem", color: "#666" }}>
            Expected claims: <code>iss=https://tcss-460-iam.onrender.com</code>,{" "}
            <code>aud=group-7-api</code>
          </p>
          <pre
            style={{
              background: "#f4f4f4",
              padding: "1rem",
              wordBreak: "break-all",
              whiteSpace: "pre-wrap",
              borderRadius: "4px",
            }}
          >
            {session.accessToken}
          </pre>
        </>
      )}

      {!session && (
        <p>
          Not signed in. <a href="/api/auth/signin">Sign in</a> first.
        </p>
      )}
    </main>
  )
}
