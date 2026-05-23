import { auth, signIn, signOut } from "@/auth"

export default async function Header() {
  const session = await auth()

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid #e5e7eb",
        fontFamily: "inherit",
      }}
    >
      <span style={{ fontWeight: 600 }}>TCSS 460 — Group 8</span>

      {session?.user ? (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem", color: "#555" }}>
            {session.user.email}
          </span>
          <form
            action={async (_: FormData) => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button type="submit" style={{ cursor: "pointer" }}>
              Sign Out
            </button>
          </form>
        </div>
      ) : (
        <form
          action={async (_: FormData) => {
            "use server"
            await signIn("tcss460")
          }}
        >
          <button type="submit" style={{ cursor: "pointer" }}>
            Sign In
          </button>
        </form>
      )}
    </header>
  )
}
