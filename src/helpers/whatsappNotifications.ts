import { requestSendMessage } from '@/services/whaticket';

interface packageReadyWhatsappData {
  contactNumber: string;
  contactName: string;
  replaceData: {
    mailbox: string;
    tracking: string;
    amount: { usd: string; crc: string };
  };
}

export const sendPackageReadyWhatsapp = async ({
  contactNumber,
  contactName,
  replaceData
}: packageReadyWhatsappData) => {
  const body = `
¡Hola, ${contactName} 👋!

📦 Buenas noticias: tu paquete ya llegó a Costa Rica 🇨🇷 y está listo para ser retirado.

🔐 Casillero: ${replaceData.mailbox}
📍 Tracking: ${replaceData.tracking}

💰 Monto a pagar:
• USD: ${replaceData.amount.usd}
• CRC: ${replaceData.amount.crc}
_(Calculado según el tipo de cambio del día)_

🚚 Si prefieres, contamos con servicio de entrega a domicilio.
Solo indícanos cuándo lo deseas y lo coordinamos.

Gracias por elegirnos. ¡Esperamos que disfrutes tu compra! 😊`;

  const cleanPhoneNumber = contactNumber.replace(/\D/g, '');

  return requestSendMessage({
    number: cleanPhoneNumber,
    name: contactName,
    body
  });
};
