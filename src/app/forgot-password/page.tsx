"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(
      email.trim()
    );

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!emailValid) {
      return;
    }

    /*
     * Later:
     * Send password reset request to backend.
     *
     * The backend should always return a generic
     * response whether the email exists or not.
     */

    setSubmitted(true);
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
          FORGOT PASSWORD
      ========================= */}

      <section className="signup-section">

        <div className="signup-card forgot-password-card">

          {!submitted ? (

            <>
              {/* Heading */}

              <div className="signup-heading">

                <p className="eyebrow auth-eyebrow">
                  ACCOUNT RECOVERY
                </p>

                <h1>
                  Forgot your password?
                </h1>

                <p>
                  Enter the email address associated
                  with your account and we&apos;ll send
                  you instructions to reset your password.
                </p>

              </div>

              {/* Form */}

              <form
                onSubmit={handleSubmit}
                className="signup-form"
              >

                <div className="form-field">

                  <label htmlFor="email">
                    Email Address <span>*</span>
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    required
                  />

                  {email.length > 0 &&
                    !emailValid && (
                      <p className="field-error">
                        Your email is incorrect.
                      </p>
                    )}

                </div>

                {/* Send Request */}

                <button
                  type="submit"
                  className="create-account-button"
                  disabled={!emailValid}
                >
                  Send Reset Link
                </button>

              </form>

              {/* Back to Login */}

              <p className="login-prompt">

                Remember your password?

                <a href="/login">
                  {" "}Login
                </a>

              </p>
            </>

          ) : (

            <>
              {/* =========================
                  GENERIC SUCCESS MESSAGE
              ========================= */}

              <div className="reset-success">

                <div className="reset-success-icon">
                  ✓
                </div>

                <p className="eyebrow auth-eyebrow">
                  REQUEST RECEIVED
                </p>

                <h1>
                  Check your inbox.
                </h1>

                <p>
                  If your email address exists in
                  our database, you will receive a
                  password reset link in your inbox.
                </p>

                <p className="reset-security-note">
                  Please check your spam or junk
                  folder if you don&apos;t see the email.
                </p>

                <a
                  href="/login"
                  className="back-login-button"
                >
                  Back to Login
                </a>

              </div>
            </>

          )}

        </div>

      </section>

    </main>
  );
}