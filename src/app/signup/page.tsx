"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] =
    useState("");
  const [surname, setSurname] =
    useState("");
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [termsAccepted, setTermsAccepted] =
    useState(false);
  const [passwordFocused, setPasswordFocused] =
    useState(false);

  const [loading, setLoading] =
    useState(false);
  const [serverError, setServerError] =
    useState("");
  const [accountExists, setAccountExists] =
    useState(false);

  const passwordWrapperRef =
    useRef<HTMLDivElement>(null);

  /* =========================
     FIRST NAME
  ========================= */

  const firstNameValid =
    firstName.trim().length >= 2 &&
    firstName.trim().length <= 25;

  /* =========================
     SURNAME
  ========================= */

  const surnameValid =
    surname.trim().length >= 2 &&
    surname.trim().length <= 25;

  /* =========================
     EMAIL
  ========================= */

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(
      email.trim()
    );

  /* =========================
     PASSWORD RULES
  ========================= */

  const passwordRules = useMemo(
    () => ({
      length:
        password.length >= 8 &&
        password.length <= 25,

      uppercase:
        /[A-Z]/.test(password),

      lowercase:
        /[a-z]/.test(password),

      number:
        /[0-9]/.test(password),

      special:
        /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const passwordValid =
    Object.values(passwordRules).every(
      Boolean
    );

  /* =========================
     CONFIRM PASSWORD
  ========================= */

  const confirmPasswordValid =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  /* =========================
     COMPLETE FORM
  ========================= */

  const formValid =
    firstNameValid &&
    surnameValid &&
    emailValid &&
    passwordValid &&
    confirmPasswordValid &&
    termsAccepted;

  /* =========================
     CLOSE PASSWORD BOX
     WHEN CLICKING OUTSIDE
  ========================= */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        passwordWrapperRef.current &&
        !passwordWrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setPasswordFocused(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =========================
     SUBMIT
  ========================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setServerError("");
    setAccountExists(false);

    if (!formValid || loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/signup",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            firstName:
              firstName.trim(),

            surname:
              surname.trim(),

            email:
              email
                .trim()
                .toLowerCase(),

            password,

            confirmPassword,
          }),
        }
      );

      const data =
        await response.json();

      /* =========================
         EXISTING ACCOUNT
      ========================= */

      if (response.status === 409) {
        setAccountExists(true);

        setServerError(
          data.message ||
            "An account with this email already exists."
        );

        return;
      }

      /* =========================
         OTHER SERVER ERRORS
      ========================= */

      if (!response.ok) {
        setServerError(
          data.message ||
            "Unable to create your account. Please try again."
        );

        return;
      }

      /*
       * OTP has been sent successfully.
       * Move the user to the OTP
       * verification page.
       */

      router.push(
        `/signup/verify?email=${encodeURIComponent(
          email.trim().toLowerCase()
        )}`
      );
    } catch (error) {
      console.error(
        "Signup request failed:",
        error
      );

      setServerError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     GOOGLE AUTHENTICATION
  ========================= */

  function continueWithGoogle() {
    if (loading) {
      return;
    }

    window.location.href =
      "/api/auth/google/start";
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
          SIGNUP SECTION
      ========================= */}

      <section className="signup-section">
        <div className="signup-card">
          {/* =========================
              HEADING
          ========================= */}

          <div className="signup-heading">
            <p className="eyebrow auth-eyebrow">
              JOIN CYBERLEARN
            </p>

            <h1>
              Create your account
            </h1>

            <p>
              Start your cybersecurity
              learning journey with
              practice, questions and
              focused preparation.
            </p>
          </div>

          {/* =========================
              FORM
          ========================= */}

          <form
            onSubmit={handleSubmit}
            className="signup-form"
          >
            {/* =========================
                FIRST NAME + SURNAME
            ========================= */}

            <div className="form-row">
              {/* First Name */}

              <div className="form-field">
                <label htmlFor="firstName">
                  First Name{" "}
                  <span>*</span>
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  autoComplete="given-name"
                  minLength={2}
                  maxLength={25}
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(
                      event.target.value
                    );

                    setServerError("");
                    setAccountExists(false);
                  }}
                  required
                  disabled={loading}
                />

                {firstName.length > 0 &&
                  !firstNameValid && (
                    <p className="field-error">
                      First name must be
                      between 2 and 25
                      characters.
                    </p>
                  )}
              </div>

              {/* Surname */}

              <div className="form-field">
                <label htmlFor="surname">
                  Surname <span>*</span>
                </label>

                <input
                  id="surname"
                  name="surname"
                  type="text"
                  placeholder="Surname"
                  autoComplete="family-name"
                  minLength={2}
                  maxLength={25}
                  value={surname}
                  onChange={(event) => {
                    setSurname(
                      event.target.value
                    );

                    setServerError("");
                    setAccountExists(false);
                  }}
                  required
                  disabled={loading}
                />

                {surname.length > 0 &&
                  !surnameValid && (
                    <p className="field-error">
                      Surname must be
                      between 2 and 25
                      characters.
                    </p>
                  )}
              </div>
            </div>

            {/* =========================
                EMAIL
            ========================= */}

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
                  setAccountExists(false);
                }}
                required
                disabled={loading}
              />

              {email.length > 0 &&
                !emailValid && (
                  <p className="field-error">
                    Your email is incorrect.
                  </p>
                )}
            </div>

            {/* =========================
                PASSWORD
            ========================= */}

            <div
              className="password-field-wrapper"
              ref={passwordWrapperRef}
            >
              <div className="form-field">
                <label htmlFor="password">
                  Password <span>*</span>
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  maxLength={25}
                  value={password}
                  onFocus={() => {
                    if (
                      password.length > 0 &&
                      !passwordValid
                    ) {
                      setPasswordFocused(
                        true
                      );
                    }
                  }}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setPassword(value);
                    setServerError("");
                    setAccountExists(false);

                    if (
                      value.length === 0
                    ) {
                      setPasswordFocused(
                        false
                      );

                      return;
                    }

                    if (
                      !(
                        value.length >= 8 &&
                        value.length <= 25 &&
                        /[A-Z]/.test(
                          value
                        ) &&
                        /[a-z]/.test(
                          value
                        ) &&
                        /[0-9]/.test(
                          value
                        ) &&
                        /[^A-Za-z0-9]/.test(
                          value
                        )
                      )
                    ) {
                      setPasswordFocused(
                        true
                      );
                    } else {
                      setPasswordFocused(
                        false
                      );
                    }
                  }}
                  required
                  disabled={loading}
                />
              </div>

              {/* =========================
                  PASSWORD REQUIREMENTS
              ========================= */}

              {passwordFocused &&
                !passwordValid && (
                  <div className="password-requirements">
                    <div className="password-requirements-header">
                      <div>
                        Password requirements
                      </div>

                      <span>
                        {
                          Object.values(
                            passwordRules
                          ).filter(Boolean)
                            .length
                        }
                        /5
                      </span>
                    </div>

                    <div className="password-rules-list">
                      <PasswordRule
                        valid={
                          passwordRules.length
                        }
                        text="8–25 characters"
                      />

                      <PasswordRule
                        valid={
                          passwordRules.uppercase
                        }
                        text="At least 1 uppercase letter"
                      />

                      <PasswordRule
                        valid={
                          passwordRules.lowercase
                        }
                        text="At least 1 lowercase letter"
                      />

                      <PasswordRule
                        valid={
                          passwordRules.number
                        }
                        text="At least 1 number"
                      />

                      <PasswordRule
                        valid={
                          passwordRules.special
                        }
                        text="At least 1 special character (@, #, !, etc.)"
                      />
                    </div>
                  </div>
                )}
            </div>

            {/* =========================
                CONFIRM PASSWORD
            ========================= */}

            <div className="form-field">
              <label htmlFor="confirmPassword">
                Confirm Password{" "}
                <span>*</span>
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                autoComplete="new-password"
                maxLength={25}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(
                    event.target.value
                  );

                  setServerError("");
                  setAccountExists(false);
                }}
                required
                disabled={loading}
              />

              {confirmPassword.length >
                0 &&
                !confirmPasswordValid && (
                  <p className="field-error">
                    Confirm password does
                    not match.
                  </p>
                )}

              {confirmPasswordValid && (
                <p className="field-success">
                  ✓ Passwords match.
                </p>
              )}
            </div>

            {/* =========================
                TERMS
            ========================= */}

            <label className="terms-row">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) =>
                  setTermsAccepted(
                    event.target.checked
                  )
                }
                required
                disabled={loading}
              />

              <span>
                I agree to the{" "}

                <a href="/terms">
                  Terms of Service
                </a>{" "}

                and{" "}

                <a href="/privacy">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {/* =========================
                SERVER ERROR
            ========================= */}

            {serverError && (
              <div className="signup-server-error">
                <p className="field-error">
                  {serverError}
                </p>

                {accountExists && (
                  <p className="login-prompt">
                    Please login to continue.{" "}

                    <a href="/login">
                      Login to your account
                    </a>
                  </p>
                )}
              </div>
            )}

            {/* =========================
                CREATE ACCOUNT
            ========================= */}

            <button
              type="submit"
              className="create-account-button"
              disabled={!formValid || loading}
            >
              {loading
                ? "Sending verification code..."
                : "Create Account"}
            </button>

            {/* =========================
                DIVIDER
            ========================= */}

            <div className="auth-divider">
              <span>
                or continue with
              </span>
            </div>

            {/* =========================
                GOOGLE
            ========================= */}

            <button
              type="button"
              className="google-button"
              onClick={
                continueWithGoogle
              }
              disabled={loading}
            >
              <GoogleIcon />

              <span>
                Continue with Google
              </span>
            </button>
          </form>

          {/* =========================
              LOGIN
          ========================= */}

          <p className="login-prompt">
            Already have an account?

            <a href="/login">
              {" "}Login
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

/* =========================
   PASSWORD RULE COMPONENT
========================= */

function PasswordRule({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div
      className={`password-rule ${
        valid
          ? "password-rule-valid"
          : ""
      }`}
    >
      <span className="password-rule-icon">
        {valid ? "✓" : ""}
      </span>

      <span>
        {text}
      </span>
    </div>
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