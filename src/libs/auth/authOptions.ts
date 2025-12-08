import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';

import type { User } from '@/prisma/generated/client';
import { prismaRead, prismaWrite } from '@libs/prisma';
import { verifyHash } from '@libs/argon2id';
import { decrypt } from '../crypto';
import { verify2FACode } from '../speakeasy';

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismaWrite as any),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {},
      async authorize(credentials: any) {
        if (!credentials) {
          throw new Error('No credentials provided');
        }

        const userCredentials = {
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
          code: credentials.code
        };

        const result = await login(userCredentials);

        if (!result.valid) {
          return null;
        }

        return result.data as User;
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 7 * 24 * 60 * 60
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/login', // Error code passed in query string as ?error=
    verifyRequest: '/auth/verify-request' // (used for check email message)
  },
  callbacks: {
    async session({ session }) {
      return session;
    },
    async jwt({ token }) {
      return token;
    }
  }
};

const login = async (credentials: any) => {
  try {
    const { email, password, code } = credentials;

    if (!email || !password) {
      return { valid: false };
    }

    // get admin user
    const admin = await prismaRead.administrator.findUnique({
      where: { email, user: { enabled: true } },
      select: {
        id: true,
        enabled_2fa: true,
        secret_2fa: true,
        user: {
          select: { id: true, name: true, email: true, emailVerified: true, password: true, image: true, enabled: true }
        }
      }
    });

    if (!admin || !admin.user) {
      return { valid: false };
    }

    // verify password
    const passValidation = await verifyHash(`${admin.user.password}`, password);

    if (!passValidation) {
      return { valid: false };
    }

    // verify 2fa
    if (admin.enabled_2fa) {
      const secret = decrypt(admin.secret_2fa || '');

      if (!verify2FACode(code, secret)) {
        return { valid: false };
      }
    }

    // save user log
    await prismaWrite.userLog.create({
      data: { user_id: admin.user.id, action: 'login' }
    });

    admin.user.password = null;

    return { valid: true, data: admin.user };
  } catch (error: any) {
    console.error(`Error: ${error.message}`);

    return { valid: false };
  }
};

export default authOptions;
