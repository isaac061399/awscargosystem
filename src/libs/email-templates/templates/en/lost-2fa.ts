import header from './common/header';
import footer from './common/footer';

const subject = `Reset two-factor authentication`;

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
                      <td align="center" class="es-m-p0r es-m-p0l es-m-txt-c" style="Margin:0;padding-top:15px;padding-right:40px;padding-bottom:15px;padding-left:40px"><h1 style="Margin:0;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:46px;font-style:normal;font-weight:bold;line-height:55px;color:#333333">Reset Two-Factor Authentication</h1></td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px">
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">Hi <b>{{ name }}</b>,</p>
                      </td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px">
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">We received a request to reset the two-factor authentication for your account in <b>{{ siteName }}</b>. To reset it, click the link below or copy and paste it into your browser:</p>
                      </td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px">
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px"><a href="{{ resetLink }}">Reset Your Two-Factor Authentication</a></p>
                      </td>
                     </tr>
                     <tr>
                      <td align="left" style="padding:0;Margin:0;padding-bottom:10px;padding-top:10px">
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">If you did not request this, please ignore this email. Your account will remain unchanged.</p>
                        <p style="Margin:0;mso-line-height-rule:exactly;font-family:inter, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;letter-spacing:0;color:#333333;font-size:14px">For security purposes, this link will expire in {{ expirationTime }} hours and can only be used once.</p>
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
