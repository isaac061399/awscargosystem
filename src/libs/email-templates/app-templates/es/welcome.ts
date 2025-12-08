import header from './common/header';
import footer from './common/footer';

const subject = `¡Bienvenid@ a {{ appName }}!`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Bienvenid@</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hi <b>{{ name }}</b>,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        ¡Bienvenid@ a <b>{{ appName }}</b>! Estamos emocionados de tenerte con nosotros.
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        ¡Feliz exploración!
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        El equipo de {{ appName }}
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
