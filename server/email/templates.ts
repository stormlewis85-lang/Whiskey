/**
 * Email templates for WhiskeyPedia
 */

export interface PasswordResetData {
  username: string;
  resetUrl: string;
}

export interface WelcomeData {
  displayName: string;
}

/**
 * Generate password reset email HTML
 */
export function passwordResetTemplate(data: PasswordResetData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #8B4513;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #8B4513;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      background: #8B4513;
      color: white !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #6B3510;
    }
    .footer {
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .note {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">WhiskeyPedia</div>
  </div>

  <div class="content">
    <h1>Reset Your Password</h1>

    <p>Hi ${data.username},</p>

    <p>We received a request to reset your WhiskeyPedia password. Click the button below to create a new password:</p>

    <p style="text-align: center;">
      <a href="${data.resetUrl}" class="button">Reset Password</a>
    </p>

    <div class="note">
      <strong>Note:</strong> This link will expire in 1 hour for security reasons. If you didn't request a password reset, you can safely ignore this email.
    </div>

    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 14px; color: #666;">${data.resetUrl}</p>
  </div>

  <div class="footer">
    <p>This email was sent by WhiskeyPedia. Please do not reply to this email.</p>
    <p>&copy; ${new Date().getFullYear()} WhiskeyPedia. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate welcome email HTML
 */
export function welcomeTemplate(data: WelcomeData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to WhiskeyPedia</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #8B4513;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #8B4513;
    }
    .content {
      padding: 30px 0;
    }
    .features {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .feature {
      margin: 10px 0;
      padding-left: 25px;
      position: relative;
    }
    .feature::before {
      content: "\\2713";
      position: absolute;
      left: 0;
      color: #8B4513;
      font-weight: bold;
    }
    .footer {
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">WhiskeyPedia</div>
  </div>

  <div class="content">
    <h1>Welcome, ${data.displayName}!</h1>

    <p>Your WhiskeyPedia account has been created successfully. We're excited to have you join our community of whiskey enthusiasts!</p>

    <div class="features">
      <h3>What you can do:</h3>
      <div class="feature">Catalog and manage your whiskey collection</div>
      <div class="feature">Write detailed reviews with our weighted scoring system</div>
      <div class="feature">Get AI-generated tasting notes from Rick</div>
      <div class="feature">Track bottle status and purchase history</div>
      <div class="feature">Create tasting flights and blind tastings</div>
    </div>

    <p>Start building your collection today. Cheers!</p>
  </div>

  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} WhiskeyPedia. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Plain text fallback for password reset
 */
export function passwordResetPlainText(data: PasswordResetData): string {
  return `
Reset Your WhiskeyPedia Password

Hi ${data.username},

We received a request to reset your WhiskeyPedia password. Visit the following link to create a new password:

${data.resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

---
WhiskeyPedia
  `.trim();
}

/**
 * Plain text fallback for welcome email
 */
export function welcomePlainText(data: WelcomeData): string {
  return `
Welcome to WhiskeyPedia, ${data.displayName}!

Your account has been created successfully. We're excited to have you join our community of whiskey enthusiasts!

What you can do:
- Catalog and manage your whiskey collection
- Write detailed reviews with our weighted scoring system
- Get AI-generated tasting notes from Rick
- Track bottle status and purchase history
- Create tasting flights and blind tastings

Start building your collection today. Cheers!

---
WhiskeyPedia
  `.trim();
}
