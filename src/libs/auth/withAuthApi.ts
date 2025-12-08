import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { initTranslationsApi } from '@libs/translate/functions';
import { getAdminSessionData } from '@controllers/Administrator.Controller';
import { hasAllPermissions } from '@helpers/permissions';

import authOptions from '@libs/auth/authOptions';

type Context = { params: Promise<any> };

type AuthedRequest = NextRequest & { session: any };

type AuthedHandler = (request: AuthedRequest, context: Context) => void | Response | Promise<void | Response>;

const makeAuthedRequest = (request: NextRequest, session?: any): AuthedRequest => {
  // Don't mutate NextRequest (it's a proxy)
  const clone = Object.create(Object.getPrototypeOf(request));

  Object.assign(clone, request, { session });

  return clone as AuthedRequest;
};

const withAuthApi = (requiredPermissions: string[], handler: AuthedHandler) => {
  return async (request: NextRequest, context: Context) => {
    const { t } = await initTranslationsApi(request);
    const textT: any = t('api:common', { returnObjects: true, default: {} });

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ valid: false, message: textT?.unauthorizedError }, { status: 401 });
    }

    const admin = await getAdminSessionData(session?.user?.email);

    if (!admin) {
      return NextResponse.json({ valid: false, message: textT?.unauthorizedError }, { status: 401 });
    }

    if (!hasAllPermissions(requiredPermissions, admin.permissions)) {
      return NextResponse.json({ valid: false, message: textT?.unauthorizedError }, { status: 401 });
    }

    const authedRequest = makeAuthedRequest(request, admin);

    return handler(authedRequest, context);
  };
};

export default withAuthApi;
