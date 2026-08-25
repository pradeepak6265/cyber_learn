import { Suspense } from "react";
import VerifyEmailChangeClient from "./VerifyEmailChangeClient";

export const dynamic = "force-dynamic";

function LoadingVerificationPage() {
  return (
    <main className="auth-page">
      {/* =========================
          HEADER
      ========================= */}

      <header className="auth-header">
        <a
          href="/"
          className="brand"
          aria-label="CyberLearn home"
        >
          <span className="brand-mark">
            ◈
          </span>

          <span className="brand-wordmark">
            cyber<span>learn</span>
          </span>
        </a>

        <nav
          className="auth-nav"
          aria-label="Email verification navigation"
        >
          <a href="/">
            Home
          </a>

          <a href="/#courses">
            Courses
          </a>

          <a href="/#weekly-tests">
            Weekly Tests
          </a>
        </nav>
      </header>

      {/* =========================
          LOADING CARD
      ========================= */}

      <section className="signup-section">
        <div
          className="signup-card"
          style={{
            maxWidth: "520px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 24px",
              border: "4px solid #e4e9e5",
              borderTopColor: "#172019",
              borderRadius: "50%",
              animation:
                "spin 0.8s linear infinite",
            }}
          />

          <p className="eyebrow auth-eyebrow">
            VERIFYING EMAIL
          </p>

          <h1>
            Confirming your email
          </h1>

          <p>
            Confirming your new email
            address...
          </p>
        </div>
      </section>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}

export default function VerifyEmailChangePage() {
  return (
    <Suspense
      fallback={
        <LoadingVerificationPage />
      }
    >
      <VerifyEmailChangeClient />
    </Suspense>
  );
}