'use client';

import axios from 'axios';

const defaultHeaders = { 'Content-Type': 'application/json' };

// auth

export const requestVerify2FALogin = async (email: string, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: `/api/auth/verify-2fa/${email}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { required: false };
  }
};

export const requestLost2FA = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/auth/lost-2fa`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestReset2FA = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: '/api/auth/reset-2fa',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestForgotPassword = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/auth/forgot-password`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestResetPassword = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: '/api/auth/reset-password',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// administrators

export const requestGetAdministrators = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/administrators',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewAdministrator = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/administrators`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditAdministrator = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/administrators/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteAdministrator = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/administrators/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// cache

export const requestCleanCache = async (lang: string, route?: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/cache`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params: { route }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// categories

export const requestGetCategories = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/categories',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewCategory = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/categories`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditCategory = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/categories/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteCategory = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/categories/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestStatusCategory = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/categories/${id}/status`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// contents

export const requestGetContents = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/contents',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewContent = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/contents`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditContent = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/contents/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteContent = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/contents/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestStatusContent = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/contents/${id}/status`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// global settings

export const requestEditGlobalSettings = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: '/api/global-settings',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

// media

export const requestGetMedia = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/media',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewMedia = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/media`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditMedia = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/media/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteMedia = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/media/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestGetMediaSignedUrl = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/media/signed-urls',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestUploadMedia = async (url: string, file: File, onProgress: (progressEvent: any) => void) => {
  try {
    await axios.request({
      method: 'put',
      url,
      headers: { 'Content-Type': file.type },
      data: file,
      onUploadProgress: onProgress
    });

    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return false;
  }
};

// menus

export const requestGetMenus = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/menus',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewMenu = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/menus`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditMenu = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/menus/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteMenu = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/menus/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestStatusMenu = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/menus/${id}/status`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// pages

export const requestGetPages = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/pages',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewPage = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/pages`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditPage = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/pages/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeletePage = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/pages/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestStatusPage = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/pages/${id}/status`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// notifications

export const requestGetNotifications = async (userId: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: `/api/notifications/${userId}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

// profile

export const requestEditProfile = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/profile`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditPassword = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/profile/password`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// profile 2FA

export const requestGenerate2FA = async (lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: `/api/profile/2fa/generate`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestVerify2FA = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/profile/2fa/verify`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestRemove2FA = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/profile/2fa/remove`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// push-messages

export const requestGetPushMessages = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/push-messages',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestSendPushMessage = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/push-messages`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeletePushMessage = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/push-messages/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// roles

export const requestGetRoles = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/roles',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewRole = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/roles`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditRole = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/roles/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteRole = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/roles/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// users

export const requestGetUsers = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/users',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestEditUser = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/users/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

/* ******************* Custom Entities ******************* */

// clients

export const requestGetClients = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/clients',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewClient = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/clients`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditClient = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/clients/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteClient = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/clients/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestSearchClients = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/clients/search',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestSearchActivityCodesClients = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/clients/search-activity',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// configuration

export const requestEditConfiguration = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/configuration`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// money outflows

export const requestGetMoneyOutflows = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/money-outflows',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestNewMoneyOutflow = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/money-outflows`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteMoneyOutflow = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/money-outflows/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// offices

export const requestGetOfficesNavbar = async () => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/offices/navbar',
      headers: { ...defaultHeaders }
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestGetOffices = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/offices',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewOffice = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/offices`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditOffice = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/offices/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteOffice = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/offices/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// orders

export const requestGetOrders = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/orders',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewOrder = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/orders`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditOrder = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/orders/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteOrder = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/orders/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteOrderProduct = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/orders/products/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// export const requestChangeStatusOrder = async (
//   id: number,
//   action: 'on-the-way' | 'ready' | 'delivered',
//   lang: string
// ) => {
//   try {
//     const response = await axios.request({
//       method: 'put',
//       url: `/api/orders/${id}/${action}`,
//       headers: { ...defaultHeaders, 'Accept-Language': lang }
//     });

//     return response.data;
//   } catch (e: any) {
//     // console.error(e);
//     if (e?.response?.data) {
//       return e?.response?.data;
//     }

//     return { valid: false };
//   }
// };

// packages

export const requestGetPackages = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/packages',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestDeletePackage = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/packages/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// packages reception

export const requestPackagesReceptionTracking = async (tracking: string, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: `/api/packages/reception/tracking/${tracking}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestPackagesReceptionClient = async (boxNumber: string, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: `/api/packages/reception/client/${boxNumber}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestPackagesReception = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/packages/reception`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

// products

export const requestGetProducts = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'get',
      url: '/api/products',
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      params
    });

    return response.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    // console.error(e);
    return { valid: false };
  }
};

export const requestNewProduct = async (params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'post',
      url: `/api/products`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestEditProduct = async (id: number, params: any, lang: string) => {
  try {
    const response = await axios.request({
      method: 'put',
      url: `/api/products/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang },
      data: params
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};

export const requestDeleteProduct = async (id: number, lang: string) => {
  try {
    const response = await axios.request({
      method: 'delete',
      url: `/api/products/${id}`,
      headers: { ...defaultHeaders, 'Accept-Language': lang }
    });

    return response.data;
  } catch (e: any) {
    // console.error(e);
    if (e?.response?.data) {
      return e?.response?.data;
    }

    return { valid: false };
  }
};
