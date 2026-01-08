import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead } from '@libs/prisma';

import { PackageStatus, PaymentStatus } from '@/prisma/generated/enums';
import { getOrderProductPrice } from '@/helpers/calculations';

export const GET = withAuthApi(
  ['billing.create'],
  async (req, { params }: { params: Promise<{ clientId: string }> }) => {
    const { clientId } = await params;

    const { t } = await initTranslationsApi(req);
    const textT: any = t('api:billing', { returnObjects: true, default: {} });

    try {
      // Find ready packages for that clientId
      const packages = await prismaRead.cusPackage.findMany({
        where: { client_id: parseInt(clientId), status: PackageStatus.READY, payment_status: PaymentStatus.PENDING },
        select: {
          id: true,
          tracking: true,
          description: true,
          billing_weight: true,
          billing_pound_fee: true,
          billing_amount: true,
          location_shelf: true,
          location_row: true
        }
      });

      // Find ready orders products for that clientId
      const orderProducts = await prismaRead.cusOrderProduct.findMany({
        where: {
          order: { client_id: parseInt(clientId) },
          payment_status: PaymentStatus.PENDING
        },
        select: {
          id: true,
          tracking: true,
          name: true,
          quantity: true,
          price: true,
          service_price: true,
          location_shelf: true,
          location_row: true,
          order: { select: { id: true, number: true } }
        }
      });

      // format response
      const formattedPackages = formatPackagesInLines(packages);
      const formattedOrderProducts = formatOrderProductsInLines(orderProducts);

      return NextResponse.json(
        { valid: true, lines: [...formattedPackages, ...formattedOrderProducts] },
        { status: 200 }
      );
    } catch (error) {
      console.error(`Error: ${error}`);

      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
    }
  }
);

/* lines format:
  id,
  type: 'package' | 'order_product',
  package: {id, billing_weight, billing_pound_fee},
  order_product: {id, quantity, price, service_price, order: {id, number}},
  tracking,
  description,
  billing_amount,
  location_shelf,
  location_row,
 */

const formatPackagesInLines = (packages: any[]) => {
  if (!packages || packages.length === 0) return [];

  return packages.map((pkg) => ({
    id: `package-${pkg.id}`,
    type: 'package',
    package: {
      id: pkg.id,
      billing_weight: pkg.billing_weight,
      billing_pound_fee: pkg.billing_pound_fee
    },
    tracking: pkg.tracking,
    description: pkg.description,
    billing_amount: pkg.billing_amount,
    location_shelf: pkg.location_shelf,
    location_row: pkg.location_row
  }));
};

const formatOrderProductsInLines = (orderProducts: any[]) => {
  if (!orderProducts || orderProducts.length === 0) return [];

  return orderProducts.map((orderProduct) => ({
    id: `order_product-${orderProduct.id}`,
    type: 'order_product',
    order_product: {
      id: orderProduct.id,
      quantity: orderProduct.quantity,
      price: orderProduct.price,
      service_price: orderProduct.service_price,
      order: orderProduct.order
    },
    tracking: orderProduct.tracking,
    description: `${orderProduct.quantity} x ${orderProduct.name}`,
    billing_amount: getOrderProductPrice(orderProduct),
    location_shelf: orderProduct.location_shelf,
    location_row: orderProduct.location_row
  }));
};
