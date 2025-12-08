import header from './common/header';
import footer from './common/footer';

const subject = `Gracias por Contactarnos`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Soporte {{ appName }}</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hola <b>{{ name }}</b>,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        ¡Gracias por comunicarte con nosotros! Hemos recibido tu mensaje y te responderemos lo antes posible.
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Saludos cordiales,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        El equipo de {{ appName }}
      </p>
      <br>
    </td>
  </tr>
  ${footer}
`;

const data = { subject, content };

export default data;
