import { Resend } from 'resend';
import {
  passwordResetTemplate,
  welcomeTemplate,
  passwordResetPlainText,
  welcomePlainText,
  PasswordResetData,
  WelcomeData
} from './templates';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'WhiskeyPedia <noreply@whiskeypedia.app>';

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  data: PasswordResetData
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Reset Your WhiskeyPedia Password',
      html: passwordResetTemplate(data),
      text: passwordResetPlainText(data),
    });

    if (result.error) {
      console.error('Failed to send password reset email:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`Password reset email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeData
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to WhiskeyPedia!',
      html: welcomeTemplate(data),
      text: welcomePlainText(data),
    });

    if (result.error) {
      console.error('Failed to send welcome email:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`Welcome email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send a generic email (for future use)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text fallback
    });

    if (result.error) {
      console.error('Failed to send email:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log(`Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: String(error) };
  }
}
