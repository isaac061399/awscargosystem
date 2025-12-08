import nodemailer from 'nodemailer';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const sesClient = new SESv2Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  region: process.env.AWS_REGION!,
  apiVersion: '2010-12-01'
});

const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand }
});

export const sendEmailSES = async (from: string, to: string | string[], subject: string, html: string) => {
  try {
    const response = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    return response?.messageId ? { valid: true } : { valid: false, message: 'Failed to send email' };
  } catch (error: any) {
    console.error(error.message);

    return { valid: false, message: 'Failed to send email' };
  }
};
