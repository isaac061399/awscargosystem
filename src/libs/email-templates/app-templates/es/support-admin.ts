import header from './common/header';
import footer from './common/footer';

const subject = `Nuevo Mensaje de Soporte Recibido`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Mensaje de Soporte</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Se ha recibido un nuevo mensaje de soporte de un usuario. A continuación, los detalles:
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        <b>Remitente:</b> {{ userName }}
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        <b>Correo Electrónico:</b> {{ userEmail }}
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        <b>Asunto:</b> {{ subject }}
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        <b>Mensaje:</b><br>{{ message }}
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Por favor, revíselo y responda lo antes posible.
      </p>
      <br>
    </td>
  </tr>
  ${footer}
`;

const data = { subject, content };

export default data;
