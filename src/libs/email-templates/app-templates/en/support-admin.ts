import header from './common/header';
import footer from './common/footer';

const subject = `New Support Message Received`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Support Message</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        A new support message has been received from a user. Below are the details:
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        <b>Sender:</b> {{ userName }}
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        <b>Email:</b> {{ userEmail }}
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        <b>Subject:</b> {{ subject }}
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        <b>Message:</b><br>{{ message }}
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Please review and respond as soon as possible.
      </p>
      <br>
    </td>
  </tr>
  ${footer}
`;

const data = { subject, content };

export default data;
