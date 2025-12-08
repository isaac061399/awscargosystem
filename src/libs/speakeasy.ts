import QRCode from 'qrcode';
import speakeasy from 'speakeasy';

export const generate2FASecret = async (label: string) => {
  // generate secret
  const secret = speakeasy.generateSecret({
    name: label
  });

  // generate qrcode
  const qrcode = await QRCode.toDataURL(secret.otpauth_url as string);

  return { qrcode, secret: secret.base32 };
};

export const verify2FACode = (code: string, secret: string) => {
  // verify code from user with secret
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: code
  });

  return verified;
};
