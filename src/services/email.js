import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: config.email.auth.user,
        to,
        subject,
        html
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Our Platform';
    const html = `
      <h1>Welcome ${user.firstName}!</h1>
      <p>Thank you for registering with our platform.</p>
      <p>Your account has been successfully created.</p>
      <p>You can now log in using your email: ${user.email}</p>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  async sendDeactivationEmail(user) {
    const subject = 'Account Deactivation Notice';
    const html = `
      <h1>Account Deactivation</h1>
      <p>Dear ${user.firstName},</p>
      <p>Your account has been deactivated.</p>
      <p>If you believe this is a mistake, please contact our support team.</p>
    `;

    await this.sendEmail(user.email, subject, html);
  }
}

export default new EmailService();
