import { NextResponse, type NextRequest } from 'next/server';

import { initTranslationsApp } from '@libs/translate/functions';
import { decodeAccessToken } from '@libs/jsonwebtoken';
import { prismaRead } from '@libs/prisma';
import { getCachedResponse, getCacheKeyFromRequest, setCachedResponse } from './cache';

type Context = { params: Promise<any> };

type AuthedRequest = NextRequest & { session: any };

type AuthedHandler = (request: AuthedRequest, context: Context) => void | Response | Promise<void | Response>;

// request
const makeRequest = (request: NextRequest, session?: any): AuthedRequest => {
  // Don't mutate NextRequest (it's a proxy)
  const clone = Object.create(Object.getPrototypeOf(request));

  Object.assign(clone, request, { session });

  return clone as AuthedRequest;
};

// session
const getSessionApp = async (request: NextRequest) => {
  // validate access token
  const accessToken = request?.headers?.get('authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    return;
  }

  const jwtData: any = decodeAccessToken(accessToken);

  if (!jwtData) {
    return;
  }

  // get user data
  const user = await prismaRead.appUser.findUnique({
    where: { id: jwtData.id, enabled: true },
    select: { id: true, email: true, name: true, email_notifications: true, push_notifications: true }
  });

  if (!user) {
    return;
  }

  return user;
};

const appProxy = (withSession: boolean, handler: AuthedHandler) => {
  return async (request: NextRequest, context: Context) => {
    const { t } = await initTranslationsApp(request);
    const errorsT: any = t('common:errors', { returnObjects: true, default: {} });

    // maintenance validation
    const maintenanceMode = process.env.API_MAINTENANCE === 'true';

    if (maintenanceMode) {
      return NextResponse.json({ valid: false, message: errorsT?.serviceUnavailable }, { status: 503 });
    }

    // api key validation
    const apiKey = request?.headers?.get('x-api-key');

    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json({ valid: false, message: errorsT?.unauthorized }, { status: 401 });
    }

    // session validation
    let user;
    if (withSession) {
      user = await getSessionApp(request);
      if (!user) {
        return NextResponse.json({ valid: false, message: errorsT?.unauthorized }, { status: 401 });
      }
    }

    // cache validation
    const cacheKey = await getCacheKeyFromRequest(request);

    // not cacheable
    if (!cacheKey) {
      const newRequest = makeRequest(request, user);

      return handler(newRequest, context);
    }

    // cache hit
    const cachedResponse = await getCachedResponse(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        status: 200,
        headers: { 'x-cache': 'true' }
      });
    }

    // cache miss
    const newRequest = makeRequest(request, user);
    const response = await handler(newRequest, context);

    // cache successful responses
    if (cacheKey && response instanceof NextResponse && response.ok) {
      // store in cache
      const responseClone = response.clone();
      const responseData = await responseClone.json();

      await setCachedResponse(cacheKey, responseData);
    }

    return response;
  };
};

export default appProxy;
