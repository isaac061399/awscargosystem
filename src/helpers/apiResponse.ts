import type { AppUser } from '@/prisma/generated/client';
import type { SessionTokens } from '@libs/jsonwebtoken';

export const getUserResponse = (user: AppUser) => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    email_notifications: user.email_notifications,
    push_notifications: user.push_notifications
  };
};

export const getSessionResponse = (sessionTokens: SessionTokens) => {
  return {
    access_token: sessionTokens.accessToken,
    expires_in: sessionTokens.expiresIn,
    expires_at: new Date(Date.now() + sessionTokens.expiresIn * 1000).toISOString(),
    refresh_token: sessionTokens.refreshToken
  };
};
