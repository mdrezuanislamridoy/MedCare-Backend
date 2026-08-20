import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private readonly fromAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST || 'localhost';
    const port = Number(process.env.SMTP_PORT) || 1025;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    this.fromAddress =
      process.env.SMTP_FROM || 'MedCare Health Platform <noreply@medcare.local>';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });

    this.logger.log(`📧 MailService initialized with SMTP -> ${host}:${port}`);
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`✉️ Email sent successfully to ${options.to} [MessageId: ${info.messageId}]`);
      return true;
    } catch (error: any) {
      this.logger.warn(
        `⚠️ Failed to send email to ${options.to}: ${error?.message || error}. (Ensure SMTP server is running)`,
      );
      return false;
    }
  }

  async sendVerificationCodeEmail(to: string, name: string, code: string, expiresInMin = 10) {
    const subject = 'MedCare — Verify Your Email Address';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">🏥 MedCare Health</h1>
                    <p style="color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px;">Enterprise Healthcare & Telemedicine Platform</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Hello ${name || 'User'},</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                      Thank you for joining MedCare. To complete your email verification, please enter the 6-digit security code below:
                    </p>
                    
                    <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                      <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: monospace;">${code}</span>
                    </div>

                    <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0;">
                      ⏱️ This code will expire in <strong>${expiresInMin} minutes</strong>.
                    </p>
                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                      If you did not request this verification, please safely disregard this email.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} MedCare Platform. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject,
      text: `Hello ${name || 'User'}, your MedCare verification code is: ${code}. Expires in ${expiresInMin} minutes.`,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, code: string, expiresInMin = 10) {
    const subject = 'MedCare — Password Reset Security Code';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">🔐 Password Reset Request</h1>
                    <p style="color: #fee2e2; margin: 6px 0 0 0; font-size: 14px;">MedCare Security Verification</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Hello ${name || 'User'},</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                      We received a request to reset the password for your MedCare account. Use the following security code to set a new password:
                    </p>
                    
                    <div style="background-color: #fef2f2; border: 2px dashed #fca5a5; border-radius: 10px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                      <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #dc2626; font-family: monospace;">${code}</span>
                    </div>

                    <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0;">
                      ⏱️ This code will expire in <strong>${expiresInMin} minutes</strong>.
                    </p>
                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                      If you did not request a password reset, someone may have entered your email by mistake. Your account remains secure.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} MedCare Platform. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject,
      text: `Hello ${name || 'User'}, your MedCare password reset code is: ${code}. Expires in ${expiresInMin} minutes.`,
      html,
    });
  }

  async sendWelcomeEmail(to: string, name: string, role: string) {
    const subject = 'Welcome to MedCare Health Platform';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">🎉 Welcome to MedCare</h1>
                    <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 14px;">Your Healthcare Portal is Ready</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Welcome, ${name}!</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                      Your account has been successfully registered as a <strong>${role}</strong>. You now have access to MedCare's state-of-the-art healthcare management, digital appointments, and teleconsultation services.
                    </p>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">
                      If you have any questions, our support team is available 24/7.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} MedCare Platform. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject,
      text: `Welcome to MedCare, ${name}! Your account as ${role} has been created successfully.`,
      html,
    });
  }
}
