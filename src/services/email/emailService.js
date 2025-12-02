/**
 * Email Service using Resend
 * Free tier: 3000 emails/month
 */

import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send verification code email
 */
export const sendVerificationCode = async (to, code, expiryMinutes = 5) => {
  if (!resend) {
    console.warn('⚠️  Resend not configured. Verification code:', code);
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [to],
      subject: 'Withdrawal Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; margin: 20px 0; border-radius: 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Withdrawal Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested a withdrawal. Please use the following verification code to confirm your request:</p>
              
              <div class="code">${code}</div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0;">
                  <li>This code will expire in <strong>${expiryMinutes} minutes</strong></li>
                  <li>Never share this code with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error };
    }

    console.log('✅ Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send CS verification code email (2 hour expiry)
 */
export const sendCSVerificationCode = async (to, code, userName = 'User') => {
  if (!resend) {
    console.warn('⚠️  Resend not configured. CS Verification code:', code);
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [to],
      subject: 'CS Withdrawal Verification - Action Required',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: white; border: 3px solid #f5576c; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f5576c; margin: 20px 0; border-radius: 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .info { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 5px; color: #0c5460; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 CS Verification Required</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Our Customer Support team needs to verify your withdrawal request. Please provide the following code when contacted:</p>
              
              <div class="code">${code}</div>
              
              <div class="info">
                <strong>ℹ️ Information:</strong>
                <ul style="margin: 10px 0;">
                  <li>This code is valid for <strong>2 hours</strong></li>
                  <li>A CS representative will contact you via phone or message</li>
                  <li>Provide this code only to our official CS team</li>
                </ul>
              </div>
              
              <p>Our team will reach out to you shortly to complete the verification process.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Email send error:', error);
      return { success: false, error };
    }

    console.log('✅ CS Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
export const testEmailConfig = async () => {
  if (!resend) {
    return { 
      configured: false, 
      message: 'RESEND_API_KEY not set in environment variables' 
    };
  }

  return {
    configured: true,
    message: 'Resend email service is configured',
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev'
  };
};
