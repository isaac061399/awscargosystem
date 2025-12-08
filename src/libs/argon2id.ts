import { hash, verify } from '@node-rs/argon2';

// OWASP recommendation
const getOptions = (isApp = false) => ({
  memoryCost: 19923, // 19 MiB
  timeCost: 2, // iteration
  outputLen: 32,
  parallelism: 1,
  version: 1, // v0x13
  secret: Buffer.from(`${isApp ? process.env.APP_PASS_SECRET : process.env.NEXTAUTH_PASS_SECRET}`)
});

export const getHash = async (password: string): Promise<string> => {
  const options = getOptions();

  return await hash(password.normalize('NFKC'), options);
};

export const verifyHash = async (hash: string, password: string): Promise<boolean> => {
  const options = getOptions();

  return await verify(hash, password.normalize('NFKC'), options);
};

export const getHashApp = async (password: string): Promise<string> => {
  const options = getOptions(true);

  return await hash(password.normalize('NFKC'), options);
};

export const verifyHashApp = async (hash: string, password: string): Promise<boolean> => {
  const options = getOptions(true);

  return await verify(hash, password.normalize('NFKC'), options);
};
