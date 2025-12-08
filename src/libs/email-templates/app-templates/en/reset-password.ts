import header from './common/header';
import footer from './common/footer';

const subject = `Your Password Has Been Changed`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Password Changed</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hi <b>{{ name }}</b>,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        We wanted to let you know that your password for <b>{{ appName }}</b> has been changed successfully.
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        If you made this change, no further action is needed.
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        If you didn’t make this change, please contact us.
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Your security is our priority.
      </p>
      <br>

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
