const content = `
    <!-- Footer -->
    <tr>
      <td align="center" style="padding:20px; background-color:#f8f8f8;">
        <p style="margin-top:15px; font-size:14px; color:#666;">Síguenos en</p>
        <table role="presentation" cellspacing="0" cellpadding="5" border="0">
          <tr>
            {{ social }}
          </tr>
        </table>

        <p style="margin-top:15px; font-size:12px; color:#999;">
          {{ links }}
        </p>

        <p style="margin-top:15px; font-size:12px; color:#999;">
          © {{ currentYear }} {{ appName }}. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>

</html>`;

export default content;
