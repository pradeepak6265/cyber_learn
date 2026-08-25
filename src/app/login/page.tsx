"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [serverError, setServerError] =
    useState("");

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(
      email.trim()
    );

  const formValid =
    emailValid &&
    password.trim().length > 0;

  /* =========================
     LOGIN SUBMIT
  ========================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!formValid || isLoading) {
      return;
    }

    setServerError("");
    setIsLoading(true);

    try {
      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              email:
                email.trim(),
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setServerError(
          typeof data.message ===
            "string"
            ? data.message
            : "Unable to login."
        );

        return;
      }

      /*
       * Authentication cookie has now
       * been created by the server.
       *
       * Use a full navigation so the
       * server renders the authenticated
       * home page.
       */
      window.location.replace("/");
    } catch (error) {
      console.error(
        "Login request error:",
        error
      );

      setServerError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
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
          aria-label="Authentication navigation"
        >
          <a href="/#courses">
            Courses
          </a>

          <a href="/#weekly-tests">
            Weekly Tests
          </a>

          <a href="/login">
            Login
          </a>
        </nav>

      </header>

      {/* =========================
          LOGIN SECTION
      ========================= */}

      <section className="signup-section">

        <div className="signup-card login-card">

          {/* =========================
              HEADING
          ========================= */}

          <div className="signup-heading">

            <p className="eyebrow auth-eyebrow">
              WELCOME BACK
            </p>

            <h1>
              Login to your account
            </h1>

            <p>
              Continue your cybersecurity
              learning journey and keep
              track of your progress.
            </p>

          </div>

          {/* =========================
              LOGIN FORM
          ========================= */}

          <form
            onSubmit={handleSubmit}
            className="signup-form"
          >

            {/* EMAIL */}

            <div className="form-field">

              <label htmlFor="email">
                Email Address{" "}
                <span>*</span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );

                  setServerError("");
                }}
                required
              />

              {email.length > 0 &&
                !emailValid && (
                  <p className="field-error">
                    Your email is incorrect.
                  </p>
                )}

            </div>

            {/* PASSWORD */}

            <div className="form-field">

              <div className="password-label-row">

                <label htmlFor="password">
                  Password{" "}
                  <span>*</span>
                </label>

                <a
                  href="/forgot-password"
                  className="forgot-password"
                >
                  Forgot Password?
                </a>

              </div>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  setServerError("");
                }}
                required
              />

            </div>

            {/* SERVER ERROR */}

            {serverError && (
              <p
                className="field-error"
                role="alert"
              >
                {serverError}
              </p>
            )}

            {/* LOGIN */}

            <button
              type="submit"
              className="create-account-button"
              disabled={
                !formValid ||
                isLoading
              }
            >
              {isLoading
                ? "Logging in..."
                : "Login"}
            </button>

            {/* DIVIDER */}

            <div className="auth-divider">

              <span>
                or continue with
              </span>

            </div>

            {/* GOOGLE */}

            <button
              type="button"
              className="google-button"
              onClick={() => {
                /*
                 * Google authentication
                 * will be connected later.
                 */
              }}
            >
              <GoogleIcon />

              <span>
                Continue with Google
              </span>
            </button>

          </form>

          {/* SIGNUP */}

          <p className="login-prompt">

            Don't have an account?

            <a href="/signup">
              {" "}Create an account
            </a>

          </p>

        </div>

      </section>

    </main>
  );
}


/* =========================
   GOOGLE ICON
========================= */

function GoogleIcon() {
  return (
    <svg
      className="google-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >

      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.68-.06-1.34-.17-1.97H12v3.73h5.23a4.47 4.47 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.92-4.18 2.92-7.13Z"
      />

      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.5Z"
      />

      <path
        fill="#FBBC05"
        d="M6.54 13.59A5.85 5.85 0 0 1 6.23 12c0-.55.1-1.09.31-1.59V7.89H3.3A9.5 9.5 0 0 0 2.5 12c0 1.48.35 2.87.8 4.11l3.24-2.52Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.46 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.52C7.31 8.1 9.46 6.38 12 6.38Z"
      />

    </svg>
  );
}