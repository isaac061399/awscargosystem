import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = `${process.env.APP_ACCESS_SECRET}`;
const REFRESH_TOKEN_SECRET = `${process.env.APP_REFRESH_SECRET}`;

export type SessionTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
};

export type SessionData = {
  id: number;
};

export const generateTokens: (data: SessionData, newRefreshToken?: boolean) => SessionTokens = (
  data,
  newRefreshToken = true
) => {
  const accessToken = jwt.sign({ ...data }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  let refreshToken;

  if (newRefreshToken) {
    refreshToken = jwt.sign({ ...data }, REFRESH_TOKEN_SECRET); // no expiration
  }

  return { accessToken, refreshToken, expiresIn: 15 * 60 };
};

export const decodeAccessToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    return decoded;
  } catch (err) {
    console.error(`JWT AccessToken Error: ${err}`);

    return null;
  }
};

export const decodeRefreshToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

    return decoded;
  } catch (err) {
    console.error(`JWT RefreshToken Error: ${err}`);

    return null;
  }
};
