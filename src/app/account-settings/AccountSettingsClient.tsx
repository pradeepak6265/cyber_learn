"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AccountSettingsClientProps = {
  firstName: string;
  surname: string;
  email: string;
  emailVerified: boolean;
};

type EmailChangeStep =
  | "idle"
  | "enter-email"
  | "verify-current"
  | "sent";

export default function AccountSettingsClient({
  firstName: initialFirstName,
  surname: initialSurname,
  email,
  emailVerified,
}: AccountSettingsClientProps) {
  const router = useRouter();

  /* =========================
     PROFILE STATE
  ========================= */

  const [firstName, setFirstName] =
    useState(initialFirstName);

  const [surname, setSurname] =
    useState(initialSurname);

  const [originalFirstName, setOriginalFirstName] =
    useState(initialFirstName);

  const [originalSurname, setOriginalSurname] =
    useState(initialSurname);

  const [isEditing, setIsEditing] =
    useState(false);

  const [showSaveConfirm, setShowSaveConfirm] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [fieldError, setFieldError] =
    useState("");

  /* =========================
     EMAIL CHANGE STATE
  ========================= */

  const [emailChangeStep, setEmailChangeStep] =
    useState<EmailChangeStep>("idle");

  const [newEmail, setNewEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [emailChangeError, setEmailChangeError] =
    useState("");

  const [emailChangeSuccess, setEmailChangeSuccess] =
    useState("");

  const [isEmailLoading, setIsEmailLoading] =
    useState(false);

  const [attemptsLeft, setAttemptsLeft] =
    useState<number | null>(null);

  const [
    verificationEmailsRemaining,
    setVerificationEmailsRemaining,
  ] = useState<number | null>(null);

  /* =========================
     VALIDATION
  ========================= */

  function validateName(value: string) {
    return /^[A-Za-z\s'-]{2,25}$/.test(
      value.trim()
    );
  }

  const hasChanges =
    firstName.trim() !== originalFirstName ||
    surname.trim() !== originalSurname;

  /* =========================
     PROFILE EDIT
  ========================= */

  function handleEdit() {
    setFirstName(originalFirstName);
    setSurname(originalSurname);

    setError("");
    setSuccess("");
    setFieldError("");

    setIsEditing(true);
  }

  function handleCancel() {
    if (isSaving) {
      return;
    }

    setFirstName(originalFirstName);
    setSurname(originalSurname);

    setError("");
    setFieldError("");

    setIsEditing(false);
    setShowSaveConfirm(false);
  }

  function handleSaveClick() {
    setError("");
    setSuccess("");
    setFieldError("");

    const cleanFirstName =
      firstName.trim();

    const cleanSurname =
      surname.trim();

    if (!cleanFirstName || !cleanSurname) {
      setFieldError(
        "First name and surname are required."
      );
      return;
    }

    if (!validateName(cleanFirstName)) {
      setFieldError(
        "First name must contain 2 to 25 valid characters."
      );
      return;
    }

    if (!validateName(cleanSurname)) {
      setFieldError(
        "Surname must contain 2 to 25 valid characters."
      );
      return;
    }

    if (!hasChanges) {
      setFieldError(
        "No changes were made."
      );
      return;
    }

    setShowSaveConfirm(true);
  }

  async function handleConfirmSave() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    setFieldError("");

    try {
      const response = await fetch(
        "/api/auth/profile",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            firstName:
              firstName.trim(),
            surname:
              surname.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          typeof data.message ===
            "string"
            ? data.message
            : "Unable to update profile."
        );

        setShowSaveConfirm(false);
        return;
      }

      const updatedFirstName =
        data.user?.firstName ??
        firstName.trim();

      const updatedSurname =
        data.user?.surname ??
        surname.trim();

      setFirstName(updatedFirstName);
      setSurname(updatedSurname);

      setOriginalFirstName(
        updatedFirstName
      );

      setOriginalSurname(
        updatedSurname
      );

      setIsEditing(false);
      setShowSaveConfirm(false);

      setSuccess(
        "Profile information updated successfully."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );

      setShowSaveConfirm(false);
    } finally {
      setIsSaving(false);
    }
  }

  /* =========================
     EMAIL CHANGE
  ========================= */

  function handleChangeEmail() {
    setNewEmail("");
    setOtp("");

    setEmailChangeError("");
    setEmailChangeSuccess("");

    setAttemptsLeft(null);
    setVerificationEmailsRemaining(null);

    setEmailChangeStep(
      "enter-email"
    );
  }

  function handleCancelEmailChange() {
    if (isEmailLoading) {
      return;
    }

    setNewEmail("");
    setOtp("");

    setEmailChangeError("");
    setEmailChangeSuccess("");

    setAttemptsLeft(null);
    setVerificationEmailsRemaining(null);

    setEmailChangeStep("idle");
  }

  async function handleRequestCurrentEmailOtp() {
    if (isEmailLoading) {
      return;
    }

    const cleanEmail =
      newEmail.trim().toLowerCase();

    setEmailChangeError("");
    setEmailChangeSuccess("");

    if (!cleanEmail) {
      setEmailChangeError(
        "Please enter your new email address."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(
        cleanEmail
      )
    ) {
      setEmailChangeError(
        "Your email is incorrect."
      );
      return;
    }

    if (
      cleanEmail ===
      email.toLowerCase()
    ) {
      setEmailChangeError(
        "The new email must be different from your current email."
      );
      return;
    }

    setIsEmailLoading(true);

    try {
      const response = await fetch(
        "/api/auth/email-change/request",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            newEmail: cleanEmail,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setEmailChangeError(
          typeof data.message ===
            "string"
            ? data.message
            : "Unable to send verification code."
        );
        return;
      }

      setNewEmail(cleanEmail);
      setOtp("");
      setAttemptsLeft(5);

      setEmailChangeSuccess(
        "A verification code has been sent to your current email address."
      );

      setEmailChangeStep(
        "verify-current"
      );
    } catch (error) {
      console.error(
        "Current email OTP request error:",
        error
      );

      setEmailChangeError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsEmailLoading(false);
    }
  }

  async function handleVerifyCurrentEmailOtp() {
    if (isEmailLoading) {
      return;
    }

    const cleanOtp =
      otp.trim();

    setEmailChangeError("");
    setEmailChangeSuccess("");

    if (!/^\d{6}$/.test(cleanOtp)) {
      setEmailChangeError(
        "OTP must be a 6-digit code."
      );
      return;
    }

    setIsEmailLoading(true);

    try {
      const response = await fetch(
        "/api/auth/email-change/verify-current",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            otp: cleanOtp,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        if (
          typeof data.attemptsLeft ===
          "number"
        ) {
          setAttemptsLeft(
            data.attemptsLeft
          );
        }

        setEmailChangeError(
          typeof data.message ===
            "string"
            ? data.message
            : "Unable to verify the OTP."
        );

        return;
      }

      setAttemptsLeft(null);

      await sendNewEmailVerification();
    } catch (error) {
      console.error(
        "Current email OTP verification error:",
        error
      );

      setEmailChangeError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsEmailLoading(false);
    }
  }

  async function sendNewEmailVerification() {
    try {
      const response = await fetch(
        "/api/auth/email-change/send-new-email-verification",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setEmailChangeError(
          typeof data.message ===
            "string"
            ? data.message
            : "Unable to send confirmation email."
        );

        return;
      }

      setVerificationEmailsRemaining(
        typeof data.verificationEmailsRemaining ===
          "number"
          ? data.verificationEmailsRemaining
          : null
      );

      setEmailChangeError("");

      setEmailChangeSuccess(
        "Confirmation email sent to your new email address. Open that email and click Confirm Email to complete the change."
      );

      setEmailChangeStep("sent");
    } catch (error) {
      console.error(
        "New email verification error:",
        error
      );

      setEmailChangeError(
        "Unable to send the confirmation email."
      );
    }
  }

  async function handleResendVerification() {
    if (isEmailLoading) {
      return;
    }

    setIsEmailLoading(true);
    setEmailChangeError("");
    setEmailChangeSuccess("");

    try {
      const response = await fetch(
        "/api/auth/email-change/send-new-email-verification",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setEmailChangeError(
          typeof data.message ===
            "string"
            ? data.message
            : "Unable to resend the confirmation email."
        );

        return;
      }

      setVerificationEmailsRemaining(
        typeof data.verificationEmailsRemaining ===
          "number"
          ? data.verificationEmailsRemaining
          : null
      );

      setEmailChangeSuccess(
        "A new confirmation email has been sent to your new email address."
      );
    } catch (error) {
      console.error(
        "Resend verification error:",
        error
      );

      setEmailChangeError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsEmailLoading(false);
    }
  }

  /* =========================
     UI
  ========================= */

  return (
    <>
      {/* =========================
          PROFILE
      ========================= */}

      <section className="settings-card">
        <div className="section-header">
          <div>
            <h2>Profile information</h2>

            <p>
              Manage your personal
              information.
            </p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="secondary-button"
            >
              Edit
            </button>
          )}
        </div>

        <div className="profile-grid">
          {/* FIRST NAME */}

          <div>
            <label
              htmlFor="profile-first-name"
              className="field-label"
            >
              First name
            </label>

            {isEditing ? (
              <input
                id="profile-first-name"
                value={firstName}
                onChange={(event) => {
                  setFirstName(
                    event.target.value
                  );
                  setFieldError("");
                  setError("");
                  setSuccess("");
                }}
                autoComplete="given-name"
                maxLength={25}
                className="settings-input"
              />
            ) : (
              <div className="readonly-field">
                {originalFirstName}
              </div>
            )}
          </div>

          {/* SURNAME */}

          <div>
            <label
              htmlFor="profile-surname"
              className="field-label"
            >
              Surname
            </label>

            {isEditing ? (
              <input
                id="profile-surname"
                value={surname}
                onChange={(event) => {
                  setSurname(
                    event.target.value
                  );
                  setFieldError("");
                  setError("");
                  setSuccess("");
                }}
                autoComplete="family-name"
                maxLength={25}
                className="settings-input"
              />
            ) : (
              <div className="readonly-field">
                {originalSurname}
              </div>
            )}
          </div>
        </div>

        {fieldError && (
          <div className="error-message">
            {fieldError}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {isEditing && (
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="secondary-button"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveClick}
              disabled={isSaving}
              className="primary-button"
            >
              Save
            </button>
          </div>
        )}
      </section>

      {/* =========================
          EMAIL
      ========================= */}

      <section className="settings-card">
        <div className="section-header email-heading">
          <div>
            <h2>Email</h2>

            <p>
              Manage your email address
              and verification status.
            </p>
          </div>
        </div>

        <div className="email-row">
          <div className="email-information">
            <span className="field-label">
              Email address
            </span>

            <strong>
              {email}
            </strong>
          </div>

          <div
            className={
              emailVerified
                ? "verified-status"
                : "unverified-status"
            }
          >
            {emailVerified
              ? "Verified"
              : "Unverified"}
          </div>

          <button
            type="button"
            onClick={handleChangeEmail}
            disabled={isEmailLoading}
            className="secondary-button change-email-button"
          >
            Change email
          </button>
        </div>

        {/* =========================
            EMAIL CHANGE FLOW
        ========================= */}

        {emailChangeStep !== "idle" && (
          <div className="email-flow">
            <div className="flow-header">
              <div>
                <h3>
                  Change email
                </h3>

                <p>
                  Follow the verification
                  steps to securely change
                  your email address.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCancelEmailChange
                }
                disabled={isEmailLoading}
                className="close-button"
                aria-label="Close email change"
              >
                ×
              </button>
            </div>

            {emailChangeError && (
              <div className="error-message">
                {emailChangeError}
              </div>
            )}

            {emailChangeSuccess && (
              <div className="success-message">
                {emailChangeSuccess}
              </div>
            )}

            {/* ENTER NEW EMAIL */}

            {emailChangeStep ===
              "enter-email" && (
              <>
                <label
                  htmlFor="new-email"
                  className="field-label"
                >
                  New email address
                </label>

                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(event) => {
                    setNewEmail(
                      event.target.value
                    );
                    setEmailChangeError("");
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={254}
                  disabled={isEmailLoading}
                  className="settings-input"
                />

                <button
                  type="button"
                  onClick={
                    handleRequestCurrentEmailOtp
                  }
                  disabled={isEmailLoading}
                  className="primary-button full-button"
                >
                  {isEmailLoading
                    ? "Sending..."
                    : "Continue"}
                </button>
              </>
            )}

            {/* CURRENT EMAIL OTP */}

            {emailChangeStep ===
              "verify-current" && (
              <>
                <p className="flow-description">
                  Enter the 6-digit code
                  sent to{" "}
                  <strong>
                    {email}
                  </strong>
                  .
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(event) => {
                    const value =
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(0, 6);

                    setOtp(value);
                    setEmailChangeError("");
                  }}
                  placeholder="000000"
                  disabled={isEmailLoading}
                  className="otp-input"
                />

                {attemptsLeft !== null && (
                  <p className="attempts-text">
                    {attemptsLeft}{" "}
                    attempt
                    {attemptsLeft === 1
                      ? ""
                      : "s"}{" "}
                    remaining
                  </p>
                )}

                <button
                  type="button"
                  onClick={
                    handleVerifyCurrentEmailOtp
                  }
                  disabled={
                    isEmailLoading ||
                    otp.length !== 6
                  }
                  className="primary-button full-button"
                >
                  {isEmailLoading
                    ? "Verifying..."
                    : "Verify OTP"}
                </button>
              </>
            )}

            {/* SENT */}

            {emailChangeStep ===
              "sent" && (
              <>
                <div className="verification-box">
                  <span className="verification-icon">
                    ✓
                  </span>

                  <div>
                    <p>
                      Verification email
                      sent to
                    </p>

                    <strong>
                      {newEmail}
                    </strong>
                  </div>
                </div>

                <div className="confirmation-note">
                  Open the email in your
                  new inbox and click{" "}
                  <strong>
                    Confirm Email
                  </strong>
                  . Your email address
                  will not change until
                  confirmation is completed.
                </div>

                {verificationEmailsRemaining !==
                  null && (
                  <p className="remaining-text">
                    {
                      verificationEmailsRemaining
                    }{" "}
                    verification email
                    {verificationEmailsRemaining ===
                    1
                      ? ""
                      : "s"}{" "}
                    remaining in the
                    current 3-hour window.
                  </p>
                )}

                <button
                  type="button"
                  onClick={
                    handleResendVerification
                  }
                  disabled={
                    isEmailLoading ||
                    verificationEmailsRemaining ===
                      0
                  }
                  className="secondary-button full-button"
                >
                  {isEmailLoading
                    ? "Sending..."
                    : "↻ Resend verification email"}
                </button>

                {verificationEmailsRemaining ===
                  0 && (
                  <p className="limit-message">
                    You have reached the
                    3-email limit for this
                    3-hour window.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* =========================
          GOOGLE
      ========================= */}

      <section className="settings-card google-card">
        <div className="google-content">
          <div>
            <h2>
              Connect with Google
            </h2>

            <p>
              Connect your Google account
              for easier sign-in.
            </p>
          </div>

          <button
            type="button"
            disabled
            className="disabled-button"
          >
            Connect
          </button>
        </div>
      </section>

      {/* =========================
          PROFILE SAVE MODAL
      ========================= */}

      {showSaveConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-profile-title"
          className="modal-overlay"
        >
          <div className="modal-card">
            <div className="modal-icon">
              ✓
            </div>

            <h2 id="save-profile-title">
              Save profile changes?
            </h2>

            <p>
              Your first name and surname
              will be updated on your
              account.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() =>
                  setShowSaveConfirm(false)
                }
                disabled={isSaving}
                className="secondary-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="primary-button"
              >
                {isSaving
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          RESPONSIVE / COMPONENT CSS
      ========================= */}

      <style jsx>{`
        .settings-card {
          margin-top: 22px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 30px;
          box-shadow:
            0 4px 20px rgba(16, 24, 40, 0.04);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 26px;
        }

        .section-header h2,
        .google-content h2 {
          margin: 0;
          font-size: 20px;
          line-height: 1.3;
          font-weight: 700;
          color: #101828;
        }

        .section-header p,
        .google-content p {
          margin: 6px 0 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.5;
        }

        .profile-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .field-label {
          display: block;
          margin-bottom: 8px;
          color: #344054;
          font-size: 13px;
          font-weight: 600;
        }

        .settings-input {
          width: 100%;
          min-height: 46px;
          box-sizing: border-box;
          padding: 11px 14px;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          background: #ffffff;
          color: #101828;
          font-size: 14px;
          outline: none;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .settings-input:focus {
          border-color: #172019;
          box-shadow:
            0 0 0 3px
              rgba(23, 32, 25, 0.08);
        }

        .readonly-field {
          min-height: 46px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          padding: 11px 14px;
          border: 1px solid #eaecf0;
          border-radius: 9px;
          background: #f9fafb;
          color: #101828;
          font-size: 14px;
        }

        .secondary-button,
        .primary-button,
        .disabled-button {
          min-height: 40px;
          padding: 9px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            transform 0.1s ease;
        }

        .secondary-button {
          border: 1px solid #d0d5dd;
          background: #ffffff;
          color: #172019;
        }

        .secondary-button:hover:not(:disabled) {
          background: #f9fafb;
        }

        .primary-button {
          border: 1px solid #172019;
          background: #172019;
          color: #ffffff;
        }

        .primary-button:hover:not(:disabled) {
          background: #253129;
        }

        .secondary-button:disabled,
        .primary-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
        }

        .error-message,
        .success-message {
          margin-top: 18px;
          padding: 12px 14px;
          border-radius: 9px;
          font-size: 13px;
          line-height: 1.5;
        }

        .error-message {
          background: #fff5f4;
          color: #b42318;
          border: 1px solid #fecdca;
        }

        .success-message {
          background: #ecfdf3;
          color: #067647;
          border: 1px solid #abefc6;
        }

        /* EMAIL */

        .email-row {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            auto
            auto;
          align-items: center;
          gap: 24px;
          padding-top: 20px;
          border-top: 1px solid #eaecf0;
        }

        .email-information {
          min-width: 0;
        }

        .email-information strong {
          display: block;
          color: #101828;
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .verified-status,
        .unverified-status {
          white-space: nowrap;
          font-size: 13px;
          font-weight: 700;
        }

        .verified-status {
          color: #067647;
        }

        .unverified-status {
          color: #b54708;
        }

        .change-email-button {
          white-space: nowrap;
        }

        /* EMAIL FLOW */

        .email-flow {
          margin-top: 22px;
          padding: 22px;
          border: 1px solid #eaecf0;
          border-radius: 12px;
          background: #f9fafb;
        }

        .flow-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .flow-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #101828;
        }

        .flow-header p {
          margin: 5px 0 0;
          color: #667085;
          font-size: 13px;
          line-height: 1.5;
        }

        .close-button {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: #667085;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
        }

        .close-button:hover {
          background: #eaecf0;
        }

        .full-button {
          width: 100%;
          margin-top: 14px;
        }

        .flow-description {
          margin: 0 0 16px;
          color: #667085;
          font-size: 14px;
          line-height: 1.6;
        }

        .otp-input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          background: #ffffff;
          font-size: 20px;
          letter-spacing: 7px;
          text-align: center;
          outline: none;
        }

        .otp-input:focus {
          border-color: #172019;
          box-shadow:
            0 0 0 3px
              rgba(23, 32, 25, 0.08);
        }

        .attempts-text,
        .remaining-text {
          margin: 10px 0 0;
          color: #667085;
          font-size: 12px;
          text-align: center;
        }

        .verification-box {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border: 1px solid #d1fadf;
          border-radius: 10px;
          background: #ffffff;
        }

        .verification-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #ecfdf3;
          color: #067647;
          font-weight: 800;
        }

        .verification-box p {
          margin: 0 0 4px;
          color: #667085;
          font-size: 12px;
        }

        .verification-box strong {
          display: block;
          color: #101828;
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .confirmation-note {
          margin-top: 14px;
          padding: 14px;
          border-radius: 9px;
          background: #ffffff;
          border: 1px solid #eaecf0;
          color: #475467;
          font-size: 13px;
          line-height: 1.6;
        }

        .limit-message {
          margin: 10px 0 0;
          color: #b42318;
          font-size: 12px;
          text-align: center;
        }

        /* GOOGLE */

        .google-card {
          margin-bottom: 0;
        }

        .google-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .disabled-button {
          flex-shrink: 0;
          border: 1px solid #d0d5dd;
          background: #f2f4f7;
          color: #98a2b3;
          cursor: not-allowed;
        }

        /* MODAL */

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(16, 24, 40, 0.45);
        }

        .modal-card {
          width: 100%;
          max-width: 420px;
          box-sizing: border-box;
          padding: 30px;
          border-radius: 16px;
          background: #ffffff;
          box-shadow:
            0 24px 60px
              rgba(0, 0, 0, 0.18);
        }

        .modal-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
          border-radius: 50%;
          background: #ecfdf3;
          color: #067647;
          font-weight: 800;
        }

        .modal-card h2 {
          margin: 0 0 10px;
          color: #101828;
          font-size: 20px;
        }

        .modal-card > p {
          margin: 0 0 24px;
          color: #667085;
          font-size: 14px;
          line-height: 1.6;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        /* =========================
           TABLET
        ========================= */

        @media (max-width: 700px) {
          .settings-card {
            padding: 22px;
            border-radius: 14px;
          }

          .profile-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .email-row {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .change-email-button {
            width: 100%;
          }

          .google-content {
            align-items: stretch;
            flex-direction: column;
            gap: 18px;
          }

          .disabled-button {
            width: 100%;
          }
        }

        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 480px) {
          .settings-card {
            margin-top: 16px;
            padding: 18px;
            border-radius: 12px;
          }

          .section-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
            margin-bottom: 20px;
          }

          .section-header .secondary-button {
            width: 100%;
          }

          .email-heading {
            margin-bottom: 18px;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions button {
            width: 100%;
          }

          .email-flow {
            padding: 16px;
          }

          .flow-header {
            gap: 10px;
          }

          .modal-card {
            padding: 22px;
            border-radius: 14px;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .modal-actions button {
            width: 100%;
          }

          .otp-input {
            letter-spacing: 5px;
          }
        }
      `}</style>
    </>
  );
}