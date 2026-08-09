import { Resend } from "resend";

let resendClient = null;
function getClient() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set -- emails can't be sent.");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM = process.env.RESET_EMAIL_FROM || "ReanPhysics <onboarding@resend.dev>";

const SUBJECTS = {
  signup: "Verify your ReanPhysics account",
  reset: "Your ReanPhysics password reset code",
};

function bodyFor(purpose, code, ttlMinutes) {
  const intro =
    purpose === "signup"
      ? "Welcome to ReanPhysics! Use the code below to verify your email address."
      : "Someone requested a password reset for this email address.";

  return `
    <p>${intro}</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;">${code}</p>
    <p>This code expires in ${ttlMinutes} minutes. If you didn't request this, you can safely ignore this email.</p>
  `;
}

export async function sendOtpEmail(toEmail, code, purpose = "signup") {
  const client = getClient();
  const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);
  const { error } = await client.emails.send({
    from: FROM,
    to: toEmail,
    subject: SUBJECTS[purpose] || "Your ReanPhysics verification code",
    html: bodyFor(purpose, code, ttlMinutes),
  });
  if (error) {
    throw new Error(`Failed to send email: ${error.message || error}`);
  }
}
