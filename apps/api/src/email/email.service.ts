import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Force load the .env file to ensure variables are available
dotenv.config();

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.logger.log('Initializing Email Transporter...');
    this.logger.log(`SMTP Host: ${process.env.SMTP_HOST}`);
    this.logger.log(`SMTP User: ${process.env.SMTP_USER}`);

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      this.logger.log(`Attempting to send email to: ${to}`);
      
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'The Virtue College',
        to,
        subject,
        html,
      });
      
      this.logger.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error: any) {
      // This will now print the EXACT reason it failed in your terminal
      this.logger.error(`❌ Failed to send email to ${to}. Reason: ${error.message}`);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendParentWelcomeEmail(parentEmail: string, parentName: string, password: string) {
    const subject = 'Welcome to The Virtue College Parent Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #5C4033;">Welcome to The Virtue College, ${parentName}!</h2>
        <p>Your parent portal account has been successfully created.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Login Email:</strong> ${parentEmail}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
        </div>
        
        <p style="color: red; font-size: 12px;">Please change your password after your first login for security purposes.</p>
        <p>Best regards,<br>The Virtue College Administration</p>
      </div>
    `;

    return this.sendEmail(parentEmail, subject, html);
  }
}