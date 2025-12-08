const appPushConfig = {
  enabled: process.env.PUSH_ENABLED === 'true',
  provider: 'firebase', // Currently only 'firebase' is supported
  firebaseConfig: process.env.PUSH_FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(Buffer.from(process.env.PUSH_FIREBASE_SERVICE_ACCOUNT, 'base64').toString())
    : {}
};

export default appPushConfig;
