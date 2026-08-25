"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function VerifySignupClient({
  email,
}: {
  email: string;
}) {
  const router = useRouter();

  const [otp, setOtp] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] =
    useState(false);
  const [success, setSuccess] = useState("");

  const inputRefs =
    useRef<(HTMLInputElement | null)[]>([]);

  /*
   * Prevent old verification page from
   * reopening after 5 wrong attempts.
   */
  const blockedKey = email
    ? `cyberlearn_verify_blocked_${email}`
    : "";

  /* =========================
     PAGE PROTECTION
  ========================= */

  useEffect(() => {
    if (!email) {
      router.replace("/signup");
      return;
    }

    if (
      sessionStorage.getItem(blockedKey) ===
      "true"
    ) {
      router.replace("/signup");
      return;
    }

    /*
     * Replace current history entry so
     * Back does not reopen stale verify page.
     */
    window.history.replaceState(
      null,
      "",
      window.location.href
    );

    inputRefs.current[0]?.focus();
  }, [email, blockedKey, router]);

  /* =========================
     CLEAR OTP
  ========================= */

  function clearOtp() {
    setOtp([
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 50);
  }

  /* =========================
     VERIFY OTP
  ========================= */

  async function verifyOtp(code: string) {
    if (
      !email ||
      code.length !== 6 ||
      loading ||
      resendLoading
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/auth/verify-otp",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            otp: code,
          }),
        }
      );

      const data = await response.json();

      /* =========================
         5 WRONG ATTEMPTS
      ========================= */

      if (
        data.code ===
        "OTP_ATTEMPTS_EXCEEDED"
      ) {
        sessionStorage.setItem(
          blockedKey,
          "true"
        );

        /*
         * Replace instead of push.
         * Back button will not return here.
         */
        router.replace("/signup");

        return;
      }

      /* =========================
         OTHER ERRORS
      ========================= */

      if (!response.ok) {
        setError(
          data.message ||
            "Invalid verification code."
        );

        clearOtp();

        return;
      }

      /* =========================
         SUCCESS
      ========================= */

      setSuccess(
        "Email verified successfully."
      );

      sessionStorage.removeItem(
        blockedKey
      );

      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 500);
    } catch {
      setError(
        "Something went wrong. Please try again."
      );

      clearOtp();
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     REQUEST NEW OTP
  ========================= */

  async function requestNewCode() {
    if (
      !email ||
      resendLoading ||
      loading
    ) {
      return;
    }

    setResendLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/auth/resend-otp",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      /* =========================
         5 REQUESTS / HOUR
      ========================= */

      if (
        response.status === 429 ||
        data.code === "OTP_RATE_LIMIT"
      ) {
        setError(
          data.message ||
            "You have reached the maximum OTP request limit. Please try again later."
        );

        return;
      }

      /* =========================
         OTHER ERROR
      ========================= */

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to send a new verification code."
        );

        return;
      }

      /* =========================
         NEW OTP SUCCESS
      ========================= */

      /*
       * New OTP means the old OTP is invalid.
       * Backend handles this by replacing otpHash.
       */
      sessionStorage.removeItem(
        blockedKey
      );

      clearOtp();

      setSuccess(
        "A new verification code has been sent to your email."
      );
    } catch {
      setError(
        "Unable to send a new verification code. Please try again."
      );
    } finally {
      setResendLoading(false);
    }
  }

  /* =========================
     INPUT CHANGE
  ========================= */

  function handleChange(
    index: number,
    value: string
  ) {
    if (
      loading ||
      resendLoading
    ) {
      return;
    }

    const digit = value
      .replace(/\D/g, "")
      .slice(-1);

    if (!digit) {
      return;
    }

    const newOtp = [...otp];

    newOtp[index] = digit;

    setOtp(newOtp);
    setError("");

    if (index < 5) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }

    if (index === 5) {
      const completeOtp =
        newOtp.join("");

      if (
        completeOtp.length === 6
      ) {
        verifyOtp(completeOtp);
      }
    }
  }

  /* =========================
     KEYBOARD
  ========================= */

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      loading ||
      resendLoading
    ) {
      return;
    }

    if (event.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];

        newOtp[index] = "";

        setOtp(newOtp);

        return;
      }

      if (index > 0) {
        inputRefs.current[
          index - 1
        ]?.focus();
      }
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < 5
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  }

  /* =========================
     PASTE OTP
  ========================= */

  function handlePaste(
    event: React.ClipboardEvent<HTMLInputElement>
  ) {
    event.preventDefault();

    if (
      loading ||
      resendLoading
    ) {
      return;
    }

    const pasted =
      event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!pasted) {
      return;
    }

    const newOtp = [
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    pasted
      .split("")
      .forEach(
        (digit, index) => {
          newOtp[index] = digit;
        }
      );

    setOtp(newOtp);
    setError("");

    const nextIndex = Math.min(
      pasted.length,
      5
    );

    inputRefs.current[
      nextIndex
    ]?.focus();

    if (pasted.length === 6) {
      verifyOtp(pasted);
    }
  }

  /* =========================
     UI
  ========================= */

  return (
    <main className="auth-page">

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

      <section className="signup-section">

        <div className="signup-card verify-card">

          <div className="signup-heading">

            <p className="eyebrow auth-eyebrow">
              VERIFY YOUR EMAIL
            </p>

            <h1>
              Check your email.
            </h1>

            <p>
              We sent a 6-digit verification
              code to{" "}
              <strong>{email}</strong>
            </p>

          </div>

          <div className="otp-container">

            <div className="otp-label">
              Verification code
            </div>

            <div className="otp-boxes">

              {otp.map(
                (digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[
                        index
                      ] = element;
                    }}
                    className="otp-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete={
                      index === 0
                        ? "one-time-code"
                        : "off"
                    }
                    maxLength={1}
                    value={digit}
                    disabled={
                      loading ||
                      resendLoading
                    }
                    onChange={(event) =>
                      handleChange(
                        index,
                        event.target.value
                      )
                    }
                    onKeyDown={(event) =>
                      handleKeyDown(
                        index,
                        event
                      )
                    }
                    onPaste={handlePaste}
                    aria-label={`OTP digit ${
                      index + 1
                    }`}
                  />
                )
              )}

            </div>

            <p className="otp-helper">
              Enter all 6 digits.
              Verification starts
              automatically.
            </p>

          </div>

          {/* VERIFY LOADING */}

          {loading && (
            <p className="field-success">
              Verifying your email...
            </p>
          )}

          {/* RESEND LOADING */}

          {resendLoading && (
            <p className="field-success">
              Sending a new verification
              code...
            </p>
          )}

          {/* SUCCESS */}

          {success && (
            <p className="field-success">
              {success}
            </p>
          )}

          {/* ERROR */}

          {error && (
            <p className="field-error">
              {error}
            </p>
          )}

          {/* =========================
              REQUEST NEW CODE
          ========================= */}

          <button
            type="button"
            className="resend-otp-button"
            onClick={requestNewCode}
            disabled={
              loading ||
              resendLoading
            }
          >
            {resendLoading
              ? "Sending..."
              : "Request new code"}
          </button>

          <p className="otp-resend-helper">
            Requesting a new code will
            invalidate your previous code.
          </p>

          <p className="login-prompt">

            Wrong email?{" "}

            <a href="/signup">
              Go back to signup
            </a>

          </p>

        </div>

      </section>

    </main>
  );
}
