import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@/prisma/generated/client';

// prisma clients
const globalForPrisma = global as unknown as {
  prismaWrite: PrismaClient;
  prismaRead: PrismaClient;
};

const adapterWrite = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapterRead = new PrismaPg({
  connectionString: process.env.DATABASE_URL_REPLICA,
  ssl: { rejectUnauthorized: false }
});

export const prismaWrite = globalForPrisma.prismaWrite || new PrismaClient({ adapter: adapterWrite });

export const prismaRead = globalForPrisma.prismaRead || new PrismaClient({ adapter: adapterRead });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaWrite = prismaWrite;
  globalForPrisma.prismaRead = prismaRead;
}

// transactions

export type Tx = Prisma.TransactionClient;
export class TransactionError extends Error {
  status: number;
  params?: any;

  constructor(status: number, message: string, params?: any) {
    super(message);
    this.status = status;
    this.params = params;
    this.name = 'TransactionError';
  }
}

export const withTransaction = async <T>(
  fn: (tx: Tx) => Promise<T>,
  client: PrismaClient = prismaWrite
): Promise<T> => {
  return client.$transaction(async (tx) => {
    return fn(tx);
  });
};
