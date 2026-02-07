import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

import { clientSelectSchema } from '@/controllers/Client.Controller';
import { OrderStatus, PackageStatus } from '@/prisma/generated/enums';

const PACKAGE_RECEIVED: PackageStatus[] = ['READY', 'DELIVERED'];
const ORDER_RECEIVED: OrderStatus[] = ['READY', 'DELIVERED'];

export const GET = withAuthApi(
  ['packages.reception'],
  async (req, { params }: { params: Promise<{ tracking: string }> }) => {
    const { tracking } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:packages-reception', { returnObjects: true, default: {} });

    const trackingTrimmed = tracking.trim();

    try {
      // 1) Find receivable packages with that tracking number
      const packages = await prismaRead.cusPackage.findMany({
        where: { tracking: trackingTrimmed, status: { notIn: [...PACKAGE_RECEIVED] } },
        select: {
          id: true,
          billing_weight: true,
          client: { select: { ...clientSelectSchema, pound_fee: true } }
        }
      });

      // 2) Find receivable orders with that tracking number
      const orders = await prismaRead.cusOrder.findMany({
        where: {
          products: { some: { tracking: trackingTrimmed, status: { notIn: [...ORDER_RECEIVED] } } },
          status: { notIn: [...ORDER_RECEIVED] }
        },
        select: {
          id: true,
          client: { select: { ...clientSelectSchema, pound_fee: true } },
          products: {
            where: { tracking: trackingTrimmed, status: { notIn: [...ORDER_RECEIVED] } },
            select: { id: true, tracking: true }
          },
          packages: {
            where: { tracking: trackingTrimmed },
            select: { id: true, billing_weight: true }
          }
        }
      });

      // If we found something receivable, return it
      if (packages.length > 0 || orders.length > 0) {
        return NextResponse.json({ valid: true, packages, orders }, { status: 200 });
      }

      // 3) Nothing receivable found -> check if already received before
      const alreadyReceivedPackage = await prismaRead.cusPackage.findFirst({
        where: { tracking: trackingTrimmed, status: { in: [...PACKAGE_RECEIVED] } },
        select: { id: true, status: true }
      });

      const alreadyReceivedInOrder = await prismaRead.cusOrder.findFirst({
        where: { products: { some: { tracking: trackingTrimmed, status: { in: [...ORDER_RECEIVED] } } } },
        select: { id: true }
      });

      // if already received, return error
      if (alreadyReceivedPackage || alreadyReceivedInOrder) {
        return NextResponse.json({ valid: false, message: textT?.errors?.alreadyReceived }, { status: 409 });
      }

      // 4) Nothing found at all with that tracking number
      return NextResponse.json({ valid: true, packages: [], orders: [] }, { status: 200 });
    } catch (error) {
      console.error(`Error: ${error}`);

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);
