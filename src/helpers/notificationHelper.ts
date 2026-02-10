import { sendPackageReadyWhatsapp } from './whatsappNotifications';
import { packageReceptionNotification } from './emailNotifications';

type PackageReadyNotificationData = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientMailbox: string;
  tracking: string;
  amountUSD: string;
  amountCRC: string;
};

export const sendPackageReadyNotification = async (notificationData: PackageReadyNotificationData) => {
  const { clientName, clientPhone, clientEmail, clientMailbox, tracking, amountUSD, amountCRC } = notificationData;

  // send whatsapp notification logic here
  const whatsappResponse =
    clientPhone !== ''
      ? await sendPackageReadyWhatsapp({
          contactName: clientName,
          contactNumber: clientPhone,
          replaceData: {
            mailbox: clientMailbox,
            tracking: tracking,
            amount: {
              usd: amountUSD,
              crc: amountCRC
            }
          }
        })
      : null;

  // send email notification logic here
  const emailResponse =
    clientEmail !== ''
      ? await packageReceptionNotification({
          email: clientEmail,
          name: clientName,
          mailbox: clientMailbox,
          tracking,
          amountUSD,
          amountCRC,
          lang: 'es'
        })
      : null;

  return { whatsappResponse, emailResponse };
};
