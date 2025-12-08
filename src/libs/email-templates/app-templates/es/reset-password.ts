import header from './common/header';
import footer from './common/footer';

const subject = `Tu Contraseña Ha Sido Modificada`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Contraseña Modificada</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hola <b>{{ name }}</b>,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Te informamos que tu contraseña en <b>{{ appName }}</b> ha sido modificada exitosamente.
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Si fuiste tú, no necesitas hacer nada más.
      </p>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Si no realizaste este cambio, comunicate con nosotros.
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Tu seguridad es nuestra prioridad.
      </p>
      <br>

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
