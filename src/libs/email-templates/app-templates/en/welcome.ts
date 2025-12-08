import header from './common/header';
import footer from './common/footer';

const subject = `Welcome to {{ appName }}!`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Welcome</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hi <b>{{ name }}</b>,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Welcome to <b>{{ appName }}</b>! We're excited to have you on board.
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Happy exploring,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        The {{ appName }} Team
      </p>
      <br>

      <!-- Action Buttons -->
      <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:10px;">
            <a href="#"
              style="background-color:{{ primaryColor }}; color:#ffffff; text-decoration:none; padding:10px 20px; border-radius:5px; display:inline-block;">
              Get Started
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${footer}
`;

const data = { subject, content };

export default data;
