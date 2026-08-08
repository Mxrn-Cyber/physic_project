import { Resend } from "resend";

let resendClient = null;
function getClient() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set -- password reset emails can't be sent.");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const FROM = process.env.RESET_EMAIL_FROM || "ReanPhysics <onboarding@resend.dev>";

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  const client = getClient();
  const { error } = await client.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Reset your ReanPhysics password",
    html: `
      <p>Someone requested a password reset for this email address.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a> (link expires in 1 hour).</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
  if (error) {
    throw new Error(`Failed to send reset email: ${error.message || error}`);
  }
}
