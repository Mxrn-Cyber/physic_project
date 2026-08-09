import crypto from "crypto";

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function generateOtpCode() {
  const max = 10 ** OTP_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(code) {
  return crypto.createHash("sha256").update(String(code).trim()).digest("hex");
}

export function emptyOtp() {
  return {
    codeHash: null,
    purpose: null,
    channel: null,
    expiresAt: null,
    attempts: 0,
    lastSentAt: null,
  };
}

/**
 * Builds a fresh OTP record plus the plaintext code to deliver.
 * Store `otp` on the user document; send `code` to the user, never persist it.
 */
export function buildOtp(purpose, channel) {
  const code = generateOtpCode();
  return {
    otp: {
      codeHash: hashOtpCode(code),
      purpose,
      channel,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      attempts: 0,
      lastSentAt: new Date(),
    },
    code,
  };
}

export function canResend(otp) {
  if (!otp?.lastSentAt) return true;
  const elapsedSeconds = (Date.now() - new Date(otp.lastSentAt).getTime()) / 1000;
  return elapsedSeconds >= OTP_RESEND_COOLDOWN_SECONDS;
}

export function secondsUntilResend(otp) {
  if (!otp?.lastSentAt) return 0;
  const elapsedSeconds = (Date.now() - new Date(otp.lastSentAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds));
}

/**
 * Checks a submitted code against the stored OTP record for a given purpose.
 * Does NOT mutate attempts -- callers should increment + save on failure themselves,
 * so a bad request never fails to record an attempt.
 */
export function verifyOtpMatch(otp, purpose, code) {
  if (!otp?.codeHash) return { ok: false, reason: "No code was requested." };
  if (otp.purpose !== purpose) return { ok: false, reason: "This code isn't valid for that action." };
  if (otp.expiresAt && new Date(otp.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "Code expired. Request a new one." };
  }
  if ((otp.attempts || 0) >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "Too many attempts. Request a new code." };
  }
  if (!code) return { ok: false, reason: "Code is required." };
  const ok = otp.codeHash === hashOtpCode(code);
  return { ok, reason: ok ? null : "Incorrect code." };
}
