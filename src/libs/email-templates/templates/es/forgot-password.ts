import header from './common/header';
import footer from './common/footer';

const subject = `Restablecer contraseña`;

const content = `
  ${header}
       <!-- CONTENT -->
       <table cellpadding="0" cellspacing="0" class="es-content" align="center" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
             <tr>
              <td align="left" style="padding:20px;Margin:0;padding-top:0px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                     <tr>
                      <td align="center" class="es-m-p0r es-m-p0l es-m-txt-c" style="Margin:0;padding-top:15px;padding-right:40px;padding-bottom:15px;padding-left:40px"><h1 style="Margin:0;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:46px;font-style:normal;font-weight:bold;line-height:55px;color:#333333">Restablecer Contraseña</h1></td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px">
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Hola <b>{{ name }}</b>,</p>
                      </td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px">
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Recibimos una solicitud para restablecer su contraseña de su cuenta en <b>{{ siteName }}</b>. Para restablecer su contraseña, haga clic en el enlace a continuación o cópielo y péguelo en su navegador:</p>
                      </td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px">
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><a href="{{ resetLink }}">Restablecer su Contraseña</a></p>
                      </td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px">
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Si no solicitó esto, ignore este correo electrónico. Su contraseña permanecerá sin cambios.</p>
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Por motivos de seguridad, este enlace caducará en {{ expirationTime }} horas y sólo se puede utilizar una vez.</p>
                      </td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table>
       <!-- CONTENT END -->
  ${footer}
`;

const data = { subject, content };

export default data;
