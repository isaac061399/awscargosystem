import { getTemplate } from '@libs/email-templates';
import { sendEmailSES } from '@services/aws-ses';
import siteConfig from '@/configs/siteConfig';

interface EmailData {
  from?: string;
  to: string | string[];
  lang?: 'es' | 'en';
  template: 'forgot-password' | 'lost-2fa';
  replaceData: object;
}

export const sendEmail = async (emailData: EmailData) => {
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
