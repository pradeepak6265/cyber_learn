"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status =
  | "loading"
  | "success"
  | "error";

type ApiResponse = {
  success?: boolean;
  code?: string;
  message?: string;
  user?: {
    email?: string;
  };
};

export default function VerifyEmailChangeClient() {
  const searchParams =
    useSearchParams();

  const token =
    searchParams.get("token");

  const [status, setStatus] =
    useState<Status>("loading");

  const [message, setMessage] =
    useState(
      "Confirming your new email address..."
    );

  const [email, setEmail] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function confirmEmail() {
      if (!token) {
        if (!cancelled) {
          setStatus("error");

          setMessage(
            "This email verification link is invalid or incomplete."
          );
        }

        return;
      }

      try {
        const response =
          await fetch(
            `/api/auth/email-change/confirm?token=${encodeURIComponent(
              token
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          (await response.json()) as ApiResponse;

        if (cancelled) {
          return;
        }

        if (
          response.ok &&
          data.success
        ) {
          setStatus("success");

          setEmail(
            data.user?.email || ""
          );

          setMessage(
            data.message ||
              "Your email address has been changed successfully."
          );

          return;
        }

        setStatus("error");

        setMessage(
          data.message ||
            "Unable to verify your new email address."
        );
      } catch (error) {
        console.error(
          "Email confirmation error:",
          error
        );

        if (!cancelled) {
          setStatus("error");

          setMessage(
            "Something went wrong while confirming your email. Please try again."
          );
        }
      }
    }

    confirmEmail();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function goToAccountSettings() {
    window.location.replace(
      "/account-settings"
    );
  }

  function goToHome() {
    window.location.replace("/");
  }

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
          CONFIRMATION CARD
      ========================= */}

      <section className="signup-section">
        <div
          className="signup-card"
          style={{
            maxWidth: "520px",
            textAlign: "center",
          }}
        >
          {/* =========================
              LOADING
          ========================= */}

          {status === "loading" && (
            <>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  margin:
                    "0 auto 24px",
                  border:
                    "4px solid #e4e9e5",
                  borderTopColor:
                    "#172019",
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
                {message}
              </p>
            </>
          )}

          {/* =========================
              SUCCESS
          ========================= */}

          {status === "success" && (
            <>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin:
                    "0 auto 24px",
                  borderRadius: "50%",
                  background:
                    "#e9f8ee",
                  color: "#187a3d",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "30px",
                  fontWeight: 700,
                }}
              >
                ✓
              </div>

              <p className="eyebrow auth-eyebrow">
                EMAIL VERIFIED
              </p>

              <h1>
                Email changed successfully
              </h1>

              <p>
                {message}
              </p>

              {email && (
                <p
                  style={{
                    marginTop: "12px",
                    fontWeight: 600,
                  }}
                >
                  {email}
                </p>
              )}

              <button
                type="button"
                className="create-account-button"
                onClick={
                  goToAccountSettings
                }
                style={{
                  marginTop: "24px",
                }}
              >
                Go to Account Settings
              </button>

              <button
                type="button"
                onClick={goToHome}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  padding: "12px",
                  borderRadius: "7px",
                  border:
                    "1px solid #d8ddd9",
                  background:
                    "#ffffff",
                  color: "#172019",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Go to Home
              </button>
            </>
          )}

          {/* =========================
              ERROR
          ========================= */}

          {status === "error" && (
            <>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin:
                    "0 auto 24px",
                  borderRadius: "50%",
                  background:
                    "#fff1f0",
                  color: "#b42318",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "30px",
                  fontWeight: 700,
                }}
              >
                !
              </div>

              <p className="eyebrow auth-eyebrow">
                VERIFICATION FAILED
              </p>

              <h1>
                Email verification failed
              </h1>

              <p>
                {message}
              </p>

              <button
                type="button"
                className="create-account-button"
                onClick={
                  goToAccountSettings
                }
                style={{
                  marginTop: "24px",
                }}
              >
                Go to Account Settings
              </button>

              <button
                type="button"
                onClick={goToHome}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  padding: "12px",
                  borderRadius: "7px",
                  border:
                    "1px solid #d8ddd9",
                  background:
                    "#ffffff",
                  color: "#172019",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Go to Home
              </button>
            </>
          )}
        </div>
      </section>

      {/* =========================
          LOADING ANIMATION
      ========================= */}

      <style jsx>{`
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