import Twilio from "twilio";

let smsClient = null;
function getClient() {
  if (!smsClient) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set -- SMS codes can't be sent.");
    }
    smsClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return smsClient;
}

export async function sendOtpSms(toPhone, code) {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) {
    throw new Error("TWILIO_FROM_NUMBER is not set -- SMS codes can't be sent.");
  }
  const client = getClient();
  const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);
  await client.messages.create({
    from,
    to: toPhone,
    body: `Your ReanPhysics verification code is ${code}. It expires in ${ttlMinutes} minutes.`,
  });
}
