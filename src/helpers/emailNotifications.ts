import type { AppUser } from '@/prisma/generated/client';
import { getTemplate, getTemplateApp } from '@libs/email-templates';
import { sendEmailSES } from '@services/aws-ses';
import siteConfig from '@/configs/siteConfig';

interface welcomeData {
  user: AppUser;
  lang: string;
}

interface forgotPasswordData {
  user: AppUser;
  code: string;
  expirationTime: number;
  lang: string;
}

interface resetPasswordData {
  user: AppUser;
  lang: string;
}

interface supportData {
  adminEmails: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  lang: string;
}

interface formData {
  lang: string;
  to: string;
  customSiteName: string;
  type: string;
  data: any[];
}

interface packageReceptionData {
  email: string;
  name: string;
  mailbox: string;
  tracking: string;
  amountUSD: string;
  amountCRC: string;
  lang: string;
}

interface EmailData {
  from?: string;
  to: string | string[];
  lang?: string;
  template: string;
  replaceData: object;
}

export const welcomeNotification = async ({ user, lang }: welcomeData) => {
  return sendEmail({
    to: user.email,
    lang,
    template: 'welcome',
    replaceData: {
      name: user.name
    }
  });
};

export const forgotPasswordNotification = async ({ user, code, expirationTime, lang }: forgotPasswordData) => {
  return sendEmail({
    to: user.email,
    lang,
    template: 'forgot-password',
    replaceData: {
      name: user.name,
      code,
      expirationTime
    }
  });
};

export const resetPasswordNotification = async ({ user, lang }: resetPasswordData) => {
  return sendEmail({
    to: user.email,
    lang,
    template: 'reset-password',
    replaceData: {
      name: user.name
    }
  });
};

export const supportNotifications = async ({ adminEmails, name, email, subject, message, lang }: supportData) => {
  // send email to admin
  const resultAdmin = await sendEmail({
    to: adminEmails,
    lang,
    template: 'support-admin',
    replaceData: {
      userName: name,
      userEmail: email,
      subject,
      message
    }
  });

  if (!resultAdmin.valid) {
    return resultAdmin;
  }

  // // check if user has email notifications
  // if (!user.email_notifications) {
  //   return resultAdmin;
  // }

  // send email to user
  await sendEmail({
    to: email,
    lang,
    template: 'support-user',
    replaceData: {
      name: name
    }
  });

  return resultAdmin;
};

export const formNotifications = async ({ lang, to, customSiteName, type, data }: formData) => {
  const dataHtml = data
    .map(
      (d) =>
        `<p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><b>${d.label}: </b>${d.value}</p>`
    )
    .join('');

  // send email
  const result = await sendCMSEmail({
    to,
    lang,
    template: 'form',
    replaceData: {
      customSiteName,
      type,
      dataHtml
    }
  });

  return result;
};

export const packageReceptionNotification = async ({
  email,
  name,
  mailbox,
  tracking,
  amountUSD,
  amountCRC,
  lang
}: packageReceptionData) => {
  return sendEmail({
    to: email,
    lang,
    template: 'package-reception',
    replaceData: {
      name,
      mailbox,
      tracking,
      amountUSD,
      amountCRC
    }
  });
};

const sendEmail = async (emailData: EmailData) => {
  try {
    // config vars
    const { from, to, lang, template, replaceData } = emailData;
    const fromEmail = from || `${siteConfig.appFromEmail}`;

    // render the email
    const templateData: any = await getTemplateApp(template, replaceData, lang);

    // send the email
    await sendEmailSES(fromEmail, to, templateData.subject, templateData.content);

    return { valid: true };
  } catch (error) {
    console.error(`EmailError: ${error}`);

    return { valid: false, message: 'Failed to send email' };
  }
};

const sendCMSEmail = async (emailData: EmailData) => {
  try {
    // config vars
    const { from, to, lang, template, replaceData } = emailData;
    const fromEmail = from || `${siteConfig.siteFromEmail}`;

    // render the email
    const templateData: any = await getTemplate(template, replaceData, lang);

    // send the email
    await sendEmailSES(fromEmail, to, templateData.subject, templateData.content);

    return { valid: true };
  } catch (error) {
    console.error(`EmailError: ${error}`);

    return { valid: false, message: 'Failed to send email' };
  }
};
