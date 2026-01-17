import { logger } from '../utils/logger';

const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(request: EmailRequest): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@cyberdocgen.local';

  if (!apiKey) {
    logger.info('Email delivery skipped (RESEND_API_KEY not configured)', {
      to: request.to,
      subject: request.subject,
    });
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: request.to,
        subject: request.subject,
        html: request.html,
        text: request.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Email delivery failed', { status: response.status, error: errorText });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Email delivery error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function sendVerificationEmail(email: string, verificationUrl: string): Promise<boolean> {
  const subject = 'Verify your CyberDocGen account';
  const text = `Verify your email address by visiting: ${verificationUrl}`;
  const html = `
    <p>Welcome to CyberDocGen!</p>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="${verificationUrl}">Verify email</a></p>
    <p>If you did not create this account, you can ignore this message.</p>
  `;

  return sendEmail({ to: email, subject, text, html });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const subject = 'Reset your CyberDocGen password';
  const text = `Reset your password using this link: ${resetUrl}`;
  const html = `
    <p>We received a request to reset your password.</p>
    <p>Use the link below to set a new password:</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;

  return sendEmail({ to: email, subject, text, html });
}
