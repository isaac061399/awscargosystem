import header from './common/header';
import footer from './common/footer';

const subject = `Paquete Recibido en Costa Rica`;

const content = `
  ${header}
  <!-- Content -->
  <tr>
    <td style="padding:20px; font-family:Arial, sans-serif; color:#333;">
      <h2 style="margin:0; text-align:center;">Paquete Listo para Retirar</h2>
      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Hola <b>{{ name }}</b>,
      </p>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Le informamos que su paquete ha llegado exitosamente a Costa Rica y se encuentra disponible para retiro.
      </p>
      <br>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8f8f8; border:1px solid #e6e6e6; border-radius:6px;">
        <tr>
          <td style="padding:14px 16px; font-size:15px; line-height:1.6; color:#333;">
            <p style="margin:0 0 10px 0;">
              <b>Casillero:</b> {{ mailbox }}
              <br>
              <b>Número de tracking:</b> {{ tracking }}
            </p>

            <p style="margin:0;">
              <b>Monto a pagar:</b>
              <br>
              USD: {{ amountUSD }}
              <br>
              CRC: {{ amountCRC }}
              <br>
              <span style="font-size:12px; color:#777;"><i>(Calculado según el tipo de cambio del día)</i></span>
            </p>
          </td>
        </tr>
      </table>

      <br>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Adicionalmente, contamos con <b>servicio de entrega a domicilio</b>.
        <br>
        Si desea utilizar esta opción, por favor indíquenos por nuestros canales de atención al cliente la fecha de entrega de su preferencia y con gusto lo coordinaremos.
      </p>

      <p style="margin:10px 0; font-size:16px; line-height:1.5;">
        Agradecemos su confianza en <b>{{ appName }}</b>. Quedamos atentos a cualquier consulta adicional.
      </p>
    </td>
  </tr>
  ${footer}
`;

const data = { subject, content };

export default data;
