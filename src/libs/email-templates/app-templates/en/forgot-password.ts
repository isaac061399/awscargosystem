import header from './common/header';
import footer from './common/footer';

const subject = `Reset password`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Reset Password</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hi <b>{{ name }}</b>,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        We received a request to reset your password for your account in <b>{{ appName }}</b>. Here is the verification code to reset your password:
      </p>
      <br>

      <h3 style="margin:0; text-align:center;"><b>{{ code }}</b></h3>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        If you did not request this, please ignore this email. Your password will remain unchanged.
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        For security purposes, this code will expire in {{ expirationTime }} hours and can only be used once.
      </p>
      <br>
    </td>
  </tr>
  ${footer}
`;

const data = { subject, content };

export default data;
