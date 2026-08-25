import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "CyberLearn";

    if (!apiKey || !senderEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Brevo environment variables are missing.",
        },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
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
            email: senderEmail,
            name: "CyberLearn Tester",
          },
        ],

        subject: "CyberLearn Email Test",

        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>CyberLearn Email Test</h2>

            <p>
              This is a test email from the CyberLearn
              authentication system.
            </p>

            <p>
              Brevo email delivery is working successfully.
            </p>

            <hr />

            <p style="color: #666;">
              CyberLearn
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Brevo API error:", data);

      return NextResponse.json(
        {
          success: false,
          message: "Brevo rejected the email request.",
          error: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully.",
      messageId: data.messageId,
    });
  } catch (error) {
    console.error("Test email error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}