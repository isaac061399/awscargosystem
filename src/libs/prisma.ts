import 'server-only';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@/prisma/generated/client';

// prisma clients
const globalForPrisma = global as unknown as {
  prismaWrite: PrismaClient;
  prismaRead: PrismaClient;
  poolWrite: Pool;
  poolRead: Pool;
};

const poolWrite =
  globalForPrisma.poolWrite ||
  new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const poolRead =
  globalForPrisma.poolRead ||
  new Pool({ connectionString: process.env.DATABASE_URL_REPLICA, ssl: { rejectUnauthorized: false } });

const adapterWrite = new PrismaPg(poolWrite);
const adapterRead = new PrismaPg(poolRead);

export const prismaWrite = globalForPrisma.prismaWrite || new PrismaClient({ adapter: adapterWrite });

export const prismaRead = globalForPrisma.prismaRead || new PrismaClient({ adapter: adapterRead });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.poolWrite = poolWrite;
  globalForPrisma.poolRead = poolRead;
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
