import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

// Never let email failures break the actual action (sending a doc, creating an
// account, etc.) — this always resolves, logging a warning on failure instead
// of throwing, since a missing/broken email setup shouldn't block real work.
export async function sendMail({ to, subject, html, attachments }) {
  const t = getTransporter();
  if (!t) {
    console.warn("sendMail skipped: GMAIL_USER / GMAIL_APP_PASSWORD not configured.");
    return { sent: false, reason: "not_configured" };
  }
  try {
    await t.sendMail({
      from: `"ASHES" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });
    return { sent: true };
  } catch (e) {
    console.warn("sendMail failed:", e.message);
    return { sent: false, reason: e.message };
  }
}

export function isMailConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}
