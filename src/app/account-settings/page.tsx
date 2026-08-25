import { requireUser } from "@/lib/auth";
import UserMenu from "@/components/UserMenu";
import AccountSettingsClient from "./AccountSettingsClient";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await requireUser();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8faf9",
        color: "#172019",
      }}
    >
      {/* =========================
          HEADER
      ========================= */}

      <header
        style={{
          minHeight: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px clamp(20px, 6vw, 90px)",
          background: "#ffffff",
          borderBottom: "1px solid #eaecf0",
          boxSizing: "border-box",
        }}
      >
        {/* BRAND */}

        <a
          href="/"
          aria-label="CyberLearn home"
          style={{
            textDecoration: "none",
            color: "#172019",
            fontWeight: 800,
            fontSize: "20px",
            letterSpacing: "-0.5px",
            whiteSpace: "nowrap",
          }}
        >
          ◈ cyber
          <span
            style={{
              fontWeight: 500,
            }}
          >
            learn
          </span>
        </a>

        {/* HEADER RIGHT */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* HOME */}

          <a
            href="/"
            style={{
              textDecoration: "none",
              color: "#344054",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Home
          </a>

          {/* USER MENU */}

          <UserMenu
            firstName={user.firstName}
          />
        </div>
      </header>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div
        style={{
          width: "min(920px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "52px 0 70px",
          boxSizing: "border-box",
        }}
      >
        {/* =========================
            BREADCRUMB
        ========================= */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "18px",
            fontSize: "13px",
            color: "#667085",
          }}
        >
          <a
            href="/dashboard"
            style={{
              color: "#667085",
              textDecoration: "none",
            }}
          >
            Dashboard
          </a>

          <span>/</span>

          <span
            style={{
              color: "#344054",
              fontWeight: 600,
            }}
          >
            Account Settings
          </span>
        </div>

        {/* =========================
            PAGE HEADING
        ========================= */}

        <div
          style={{
            marginBottom: "34px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(28px, 4vw, 36px)",
              lineHeight: 1.15,
              letterSpacing: "-1px",
              fontWeight: 750,
            }}
          >
            Account Settings
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#667085",
              fontSize: "15px",
              lineHeight: 1.6,
              maxWidth: "620px",
            }}
          >
            Manage your profile, email
            address and connected accounts.
          </p>
        </div>

        {/* =========================
            ACCOUNT SETTINGS
        ========================= */}

        <AccountSettingsClient
          firstName={user.firstName}
          surname={user.surname}
          email={user.email}
          emailVerified={user.emailVerified}
        />

        {/* =========================
            GO TO DASHBOARD
        ========================= */}

        <div
          style={{
            marginTop: "34px",
            paddingTop: "24px",
            borderTop: "1px solid #eaecf0",
          }}
        >
          <a
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#344054",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            <span>←</span>
            <span>Go to Dashboard</span>
          </a>
        </div>
      </div>

      {/* =========================
          FOOTER
      ========================= */}

      <footer
        style={{
          borderTop: "1px solid #eaecf0",
          background: "#ffffff",
          padding: "24px clamp(20px, 6vw, 90px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
          color: "#667085",
          fontSize: "13px",
          boxSizing: "border-box",
        }}
      >
        <span>
          © 2026 CyberLearn.
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <a
            href="/"
            style={{
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Home
          </a>

          <a
            href="/dashboard"
            style={{
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Dashboard
          </a>
        </div>
      </footer>
    </main>
  );
}