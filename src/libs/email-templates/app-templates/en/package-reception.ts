import header from './common/header';
import footer from './common/footer';

const subject = `Package Received in Costa Rica`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Package Ready for Pickup</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hi <b>{{ name }}</b>,
      </p>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        We are pleased to inform you that your package has successfully arrived in Costa Rica and is available for pickup.
      </p>
      <br>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8f8f8; border:1px solid #e6e6e6; border-radius:6px;">
        <tr>
          <td style="padding:14px 16px; font-size:15px; line-height:1.6; color:#333;">
            <p style="margin:0 0 10px 0;">
              <b>Mailbox:</b> {{ mailbox }}
              <br>
              <b>Tracking Number:</b> {{ tracking }}
            </p>

            <p style="margin:0;">
              <b>Amount to Pay:</b>
              <br>
              USD: {{ amountUSD }}
              <br>
              CRC: {{ amountCRC }}
              <br>
              <span style="font-size:12px; color:#777;"><i>(Calculated according to the exchange rate of the day)</i></span>
            </p>
          </td>
        </tr>
      </table>

      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Additionally, we offer <b>home delivery service</b>.
        <br>
        If you wish to use this option, please let us know through our customer service channels your preferred delivery date and we will be happy to arrange it.
      </p>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        We appreciate your confidence in <b>{{ appName }}</b>. We remain available for any additional inquiries.
      </p>
    </td>
  </tr>
  ${footer}
`;

const data = { subject, content };

export default data;
