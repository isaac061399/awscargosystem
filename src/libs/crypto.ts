import CryptoJS from 'crypto-js';

export const encrypt = (text: string) => {
  return CryptoJS.AES.encrypt(text, `${process.env.NEXTAUTH_2FA_SECRET}`).toString();
};

export const decrypt = (encrypted: string) => {
  return CryptoJS.AES.decrypt(encrypted, `${process.env.NEXTAUTH_2FA_SECRET}`).toString(CryptoJS.enc.Utf8);
};

export const createDigest = (input: string) => {
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Base64url);
};
