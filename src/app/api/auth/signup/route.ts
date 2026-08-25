import { NextResponse } from "next/server";
import { createHash, randomBytes, randomInt } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/* =========================
   HELPERS
========================= */

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidName(name: string) {
  return /^[A-Za-z\s'-]{2,25}$/.test(name.trim());
}

function isValidPassword(password: string) {
  return (
    password.length >= 8 &&
    password.length <= 25 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/* =========================
   SEND OTP EMAIL
========================= */

async function sendOtpEmail(
  email: string,
  firstName: string,
  surname: string,
  otp: string
) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL;

  const senderName =
    process.env.BREVO_SENDER_NAME ||
    "CyberLearn";

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Brevo environment variables are missing."
    );
  }

  const brevoResponse = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",

      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },

      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },

        to: [
          {
            email,
            name: `${firstName} ${surname}`,
          },
        ],

        subject:
          "Verify your CyberLearn account",

        htmlContent: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            color: #172019;
          ">

            <h2>
              Verify your CyberLearn account
            </h2>

            <p>
              Hi ${firstName},
            </p>

            <p>
              Use the verification code below to
              complete your CyberLearn account creation.
            </p>

            <div style="
              margin: 30px 0;
              padding: 20px;
              text-align: center;
              background: #f1fff6;
              border: 1px solid #b7e8c9;
            ">

              <div style="
                font-size: 32px;
                font-weight: 700;
                letter-spacing: 8px;
              ">
                ${otp}
              </div>

            </div>

            <p>
              This code will expire in
              <strong>10 minutes</strong>.
            </p>

            <p>
              If you did not request this account,
              you can safely ignore this email.
            </p>

            <hr style="
              border: 0;
              border-top: 1px solid #ddd;
              margin: 30px 0;
            " />

            <p style="
              color: #68736c;
              font-size: 12px;
            ">
              CyberLearn
            </p>

          </div>
        `,
      }),
    }
  );

  if (!brevoResponse.ok) {
    const error =
      await brevoResponse.text();

    console.error(
      "Brevo signup OTP error:",
      error
    );

    throw new Error(
      "Brevo email sending failed."
    );
  }
}

/* =========================
   POST
========================= */

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const firstName =
      typeof body.firstName === "string"
        ? body.firstName.trim()
        : "";

    const surname =
      typeof body.surname === "string"
        ? body.surname.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? normalizeEmail(body.email)
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    /* =========================
       REQUIRED FIELDS
    ========================= */

    if (
      !firstName ||
      !surname ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All fields are required.",
        },
        { status: 400 }
      );
    }

    /* =========================
       VALIDATION
    ========================= */

    if (!isValidName(firstName)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "First name must contain 2 to 25 valid characters.",
        },
        { status: 400 }
      );
    }

    if (!isValidName(surname)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Surname must contain 2 to 25 valid characters.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your email is incorrect.",
        },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password does not meet the required security requirements.",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Confirm password is not same.",
        },
        { status: 400 }
      );
    }

    /* =========================
       CHECK EXISTING USER
    ========================= */

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    /* =========================
       FIND PENDING SIGNUP
    ========================= */

    const existingPending =
      await prisma.pendingSignup.findFirst({
        where: {
          email,
        },
      });

    const now = new Date();

    let requestCount = 0;
    let windowStart = now;

    /* =========================
       OTP REQUEST RATE LIMIT

       MAX 5 REQUESTS / 1 HOUR
    ========================= */

    if (existingPending) {
      const currentWindowStart =
        existingPending.otpRequestWindowStart;

      if (
        currentWindowStart &&
        now.getTime() -
          currentWindowStart.getTime() <
          60 * 60 * 1000
      ) {
        requestCount =
          existingPending.otpRequestCount;

        windowStart =
          currentWindowStart;

        /* =========================
           LIMIT REACHED
        ========================= */

        if (requestCount >= 5) {
          const retryAt =
            currentWindowStart.getTime() +
            60 * 60 * 1000;

          const minutesRemaining =
            Math.max(
              1,
              Math.ceil(
                (retryAt -
                  now.getTime()) /
                  (60 * 1000)
              )
            );

          return NextResponse.json(
            {
              success: false,
              message:
                `You have reached the maximum OTP request limit. ` +
                `Please try again in approximately ` +
                `${minutesRemaining} minute${
                  minutesRemaining === 1
                    ? ""
                    : "s"
                }.`,
            },
            { status: 429 }
          );
        }
      } else {
        /*
         * Previous one-hour window expired.
         * Start a fresh window.
         */

        requestCount = 0;
        windowStart = now;
      }
    }

    /* =========================
       GENERATE NEW OTP
    ========================= */

    const otp =
      randomInt(100000, 1000000).toString();

    const otpHash = hashOtp(otp);

    const otpExpiresAt = new Date(
      now.getTime() +
        10 * 60 * 1000
    );

    /* =========================
       GENERATE VERIFICATION
       ACCESS TOKEN
    ========================= */

    /*
     * This token is NOT the OTP.
     *
     * It proves that the browser reached
     * the verification flow through a
     * valid signup request.
     */

    const verificationToken =
      randomBytes(32).toString("hex");

    /*
     * Only the hash is stored in the database.
     */

    const verificationTokenHash =
      hashVerificationToken(
        verificationToken
      );

    /*
     * Verification access token is
     * intentionally short-lived.
     */

    const verificationTokenExpiresAt =
      new Date(
        now.getTime() +
          15 * 60 * 1000
      );

    /* =========================
       HASH PASSWORD
    ========================= */

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const newRequestCount =
      requestCount + 1;

    /* =========================
       SAVE NEW OTP + VERIFICATION
       ACCESS TOKEN
       
       IMPORTANT:
       Replacing otpHash means
       previous OTP immediately
       becomes invalid.

       Replacing verificationTokenHash
       also invalidates the previous
       verification access token.
    ========================= */

    if (existingPending) {
      await prisma.pendingSignup.update({
        where: {
          id: existingPending.id,
        },

        data: {
          firstName,
          surname,
          passwordHash,

          otpHash,
          otpExpiresAt,

          /*
           * New OTP gets a fresh
           * 5-attempt verification
           * allowance.
           */

          otpAttempts: 0,

          /*
           * Request limit is separate
           * from verification attempts.
           */

          otpRequestCount:
            newRequestCount,

          otpRequestWindowStart:
            windowStart,

          /*
           * New verification token.
           * This invalidates the old token.
           */

          verificationTokenHash,

          verificationTokenExpiresAt,
        },
      });
    } else {
      await prisma.pendingSignup.create({
        data: {
          firstName,
          surname,
          email,
          passwordHash,

          otpHash,
          otpExpiresAt,

          otpAttempts: 0,

          otpRequestCount: 1,
          otpRequestWindowStart: now,

          /*
           * Server-side verification
           * access token.
           */

          verificationTokenHash,

          verificationTokenExpiresAt,
        },
      });
    }

    /* =========================
       SEND OTP
    ========================= */

    try {
      await sendOtpEmail(
        email,
        firstName,
        surname,
        otp
      );
    } catch (error) {
      console.error(
        "OTP email sending failed:",
        error
      );

      /*
       * Do not leave an unusable
       * pending signup.
       */

      await prisma.pendingSignup.deleteMany({
        where: {
          email,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to send verification email. Please try again.",
        },
        { status: 502 }
      );
    }

    /* =========================
       SUCCESS RESPONSE
    ========================= */

    const response =
      NextResponse.json(
        {
          success: true,

          message:
            "If the email is valid, a verification code has been sent.",

          email,

          requestsUsed:
            newRequestCount,

          requestsRemaining:
            5 - newRequestCount,
        },
        { status: 200 }
      );

    /* =========================
       VERIFICATION ACCESS COOKIE
    ========================= */

    response.cookies.set({
      name:
        "cyberlearn_verification",

      value:
        verificationToken,

      /*
       * JavaScript cannot read this
       * token.
       */

      httpOnly: true,

      /*
       * HTTPS in production.
       * HTTP is allowed on localhost.
       */

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      expires:
        verificationTokenExpiresAt,
    });

    return response;

  } catch (error) {
    console.error(
      "Signup API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}