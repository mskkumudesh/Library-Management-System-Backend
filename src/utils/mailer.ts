import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn(
      "Email is not configured (EMAIL_HOST/EMAIL_USER/EMAIL_PASS missing) — emails will be skipped."
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const t = getTransporter();
  if (!t) return; // fail silently in dev if email isn't configured — never block the main flow

  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || "ShelfScan Library <no-reply@shelfscan.local>",
      to,
      subject,
      html,
    });
  } catch (err) {
    // Email failures must never break checkout/return/registration — just log it.
    console.error(`Failed to send email to ${to}:`, (err as Error).message);
  }
}
