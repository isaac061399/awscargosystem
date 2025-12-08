import header from './common/header';
import footer from './common/footer';

const subject = `Restablecer Contraseña`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Restablecer Contraseña</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hola <b>{{ name }}</b>,
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Recibimos una solicitud para restablecer su contraseña de su cuenta en <b>{{ appName }}</b>. Uitlice este código para restablecer su contraseña:
      </p>
      <br>

      <h3 style="margin:0; text-align:center;"><b>{{ code }}</b></h3>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Si no solicitó esto, ignore este correo electrónico. Su contraseña permanecerá sin cambios.
      </p>
      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Por motivos de seguridad, este código caducará en {{ expirationTime }} horas y sólo se puede utilizar una vez.
      </p>
      <br>
    </td>
  </tr>
  ${footer}
`;

const data = { subject, content };

export default data;
