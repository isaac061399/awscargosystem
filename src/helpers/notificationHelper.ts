import { sendPackageReadyWhatsapp } from './whatsappNotifications';

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
  // TODO: implement email notification
  const emailResponse = clientEmail !== '' ? /* await sendPackageReadyEmail(...) */ null : null;

  return { whatsappResponse, emailResponse };
};
