"use client";

import { useEffect, useRef, useState } from "react";

type UserMenuProps = {
  firstName: string;
};

export default function UserMenu({
  firstName,
}: UserMenuProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  /*
   * User's first-name initial.
   */
  const initial =
    firstName.trim().charAt(0).toUpperCase();

  /*
   * Close menu when clicking outside.
   */
  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
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

  /*
   * Open logout confirmation.
   */
  function handleLogoutClick() {
    setIsOpen(false);
    setShowLogoutConfirm(true);
  }

  /*
   * Cancel logout.
   */
  function handleCancelLogout() {
    if (isLoggingOut) {
      return;
    }

    setShowLogoutConfirm(false);
  }

  /*
   * Confirm logout.
   */
  async function handleConfirmLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response =
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Logout request failed."
        );
      }

      /*
       * Use a full navigation so the server
       * renders the logged-out home state.
       */
      window.location.replace("/");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      setIsLoggingOut(false);

      alert(
        "Unable to logout. Please try again."
      );
    }
  }

  return (
    <>
      {/* USER MENU */}
      <div
        ref={menuRef}
        style={{
          position: "relative",
          display: "inline-flex",
        }}
      >
        <button
          type="button"
          aria-label={`Open ${firstName}'s account menu`}
          aria-expanded={isOpen}
          onClick={() =>
            setIsOpen((current) => !current)
          }
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: "none",
            background: "#111814",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {initial}
        </button>

        {isOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              width: "190px",
              background: "#ffffff",
              border: "1px solid #e1e5e2",
              borderRadius: "10px",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.12)",
              padding: "6px",
              zIndex: 1000,
            }}
          >
            <a
              href="/dashboard"
              role="menuitem"
              onClick={() =>
                setIsOpen(false)
              }
              style={{
                display: "block",
                padding: "11px 12px",
                color: "#172019",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "7px",
              }}
            >
              Dashboard
            </a>

            <a
              href="/account-settings"
              role="menuitem"
              onClick={() =>
                setIsOpen(false)
              }
              style={{
                display: "block",
                padding: "11px 12px",
                color: "#172019",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "7px",
              }}
            >
              Account Setting
            </a>

            <button
              type="button"
              role="menuitem"
              onClick={
                handleLogoutClick
              }
              style={{
                width: "100%",
                textAlign: "left",
                padding: "11px 12px",
                color: "#b42318",
                background: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "7px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* LOGOUT CONFIRMATION */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "390px",
              background: "#ffffff",
              borderRadius: "12px",
              padding: "26px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h2
              id="logout-title"
              style={{
                margin: "0 0 10px",
                fontSize: "20px",
                color: "#172019",
              }}
            >
              Logout
            </h2>

            <p
              style={{
                margin: "0 0 24px",
                color: "#5f6862",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to
              logout?
            </p>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={
                  handleCancelLogout
                }
                disabled={isLoggingOut}
                style={{
                  padding:
                    "10px 18px",
                  borderRadius: "7px",
                  border:
                    "1px solid #d8ddd9",
                  background: "#ffffff",
                  color: "#172019",
                  fontWeight: 600,
                  cursor: isLoggingOut
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleConfirmLogout
                }
                disabled={isLoggingOut}
                style={{
                  padding:
                    "10px 18px",
                  borderRadius: "7px",
                  border: "none",
                  background: "#172019",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: isLoggingOut
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {isLoggingOut
                  ? "Logging out..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}