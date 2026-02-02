import axios from 'axios';

const BASE_URL = process.env.JETCARGO_BASE_URL!;
const USERNAME = process.env.JETCARGO_USERNAME!;
const SCOPE = process.env.JETCARGO_SCOPE || 'COURIER';
const SECRET_KEY = process.env.JETCARGO_SECRET_KEY!;
const USER_SECRET = process.env.JETCARGO_USER_SECRET!;

const headers = {
  'Content-Type': 'application/json'
};

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */

type TrackingMovement = {
  PAQUETE: number;
  WAREHOUSE: number;
  ESTADO: string;
  FECHA: string;
  ORDEN: number;
};

/* ------------------------------------------------------------------ */
/*  SIMPLE IN-MEMORY TOKEN CACHE                                       */
/* ------------------------------------------------------------------ */

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Returns cached token if still valid.
 */
const getCachedToken = (): string | null => {
  if (!cachedToken) return null;
  if (Date.now() >= tokenExpiresAt) return null;

  return cachedToken;
};

/**
 * Saves token with expiration.
 */
const setCachedToken = (token: string, ttlMs: number) => {
  cachedToken = token;
  tokenExpiresAt = Date.now() + ttlMs;
};

/**
 * Clears token cache.
 */
const clearToken = () => {
  cachedToken = null;
  tokenExpiresAt = 0;
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                           */
/* ------------------------------------------------------------------ */

const isTokenInvalid = (payload: any): boolean => {
  const msg = String(payload?.message || '').toLowerCase();
  const err = String(payload?.error || '').toLowerCase();

  return msg.includes('validar token') || msg.includes('obtenga uno nuevo') || err.includes('validacion');
};

/* ------------------------------------------------------------------ */
/*  AUTH TOKEN                                                        */
/* ------------------------------------------------------------------ */

const getAuthToken = async (forceRefresh = false): Promise<string | null> => {
  if (!forceRefresh) {
    const cached = getCachedToken();
    if (cached) return cached;
  }

  const url = `${BASE_URL}/auth/token/`;
  const params = {
    userName: USERNAME,
    scopeName: SCOPE,
    secretKey: SECRET_KEY,
    userSecret: USER_SECRET
  };

  try {
    const response = await axios.request({
      method: 'get',
      url,
      headers,
      params
    });

    if (!response.data.token) {
      console.error(response.data.message || 'No token in response');

      return null;
    }

    // Token lasts 1 hour → cache 55 minutes
    setCachedToken(response.data.token, 55 * 60 * 1000);

    return response.data.token;
  } catch (e: any) {
    console.error(e);

    return null;
  }
};

/* ------------------------------------------------------------------ */
/*  TRACKING MOVEMENTS                                                */
/* ------------------------------------------------------------------ */

export const getTrackingMovements = async (trackingNumber: string): Promise<TrackingMovement[]> => {
  const url = `${BASE_URL}/courier/tracking/`;
  const params = {
    userName: USERNAME,
    tracking: trackingNumber
  };

  // Attempt #1 with cached token
  const token1 = await getAuthToken(false);

  try {
    let response = await axios.request({
      method: 'get',
      url,
      headers: { ...headers, Authorization: `Bearer ${token1}` },
      params
    });

    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    // Token invalid → refresh once
    if (isTokenInvalid(response.data)) {
      clearToken();

      const token2 = await getAuthToken(true);

      response = await axios.request({
        method: 'get',
        url,
        headers: { ...headers, Authorization: `Bearer ${token2}` },
        params
      });

      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    }

    console.error(response.data.message || 'No data in tracking response');

    return [];
  } catch (e: any) {
    console.error(e);

    return [];
  }
};
