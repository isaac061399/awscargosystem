import header from './common/header';
import footer from './common/footer';

const subject = `Thank You for Reaching Out`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">{{ appName }} Support</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hi <b>{{ name }}</b>,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Thank you for contacting us! We’ve received your message and will get back to you as soon as possible.
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Best regards,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        The {{ appName }} Team
      </p>
      <br>
    </td>
  </tr>
  ${footer}
`;

const data = { subject, content };

export default data;
