import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { OrderStatus, PackageStatus, Prisma } from '@/prisma/generated/client';

import { calculateShippingPrice } from '@/helpers/calculations';
import { clientSelectSchema } from '@/controllers/Client.Controller';
import { validateOrderStatus } from '@/controllers/Order.Controller';

export const POST = withAuthApi(['packages.reception'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:packages-reception', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    // const office_id = data.office_id;
    const cut_number = data.cut_number ? `${data.cut_number}`.trim() : '';
    const tracking = data.tracking || '';
    const package_id = data.package_id || '';
    const order_id = data.order_id || '';
    const client_id = data.client_id || 0;
    const weight = data.weight || 0;
    const shelf = data.shelf || '';
    const row = data.row || '';

    const result = await withTransaction(async (tx) => {
      let processResult;
      if (package_id && package_id !== '') {
        // Process package reception
        processResult = await savePackageReception(
          tx,
          {
            cut_number,
            package_id: Number(package_id),
            weight: Number(weight),
            shelf,
            row
          },
          admin.id,
          textT
        );
      } else if (order_id && order_id !== '') {
        // Process order reception
        processResult = await saveOrderReception(
          tx,
          {
            cut_number,
            order_id: Number(order_id),
            tracking,
            weight: Number(weight),
            shelf,
            row
          },
          admin.id,
          textT
        );
      } else {
        // Process new package reception
        processResult = await saveNewPackageReception(
          tx,
          {
            cut_number,
            tracking,
            client_id: Number(client_id),
            weight: Number(weight),
            shelf,
            row
          },
          admin.id,
          textT
        );
      }

      return processResult;
    });

    if (!result) {
      throw new TransactionError(400, textT?.errors?.general);
    }

    // mark tracking as found if exists in unowned packages
    await markTrackingAsFound(tracking);

    if (order_id && order_id !== '') {
      // validate order status
      await validateOrderStatus(Number(order_id));
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

const savePackageReception = async (
  tx: Prisma.TransactionClient,
  data: {
    cut_number: string;
    package_id: number;
    weight: number;
    shelf: string;
    row: string;
  },
  admin_id: number,
  textT: any
) => {
  const { cut_number, package_id, weight, shelf, row } = data;
  const ready = shelf !== '' && row !== '';

  const entry = await tx.cusPackage.findUnique({
    where: { id: package_id, AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }] },
    select: {
      id: true,
      tracking: true,
      client: { select: { ...clientSelectSchema, pound_fee: true } }
    }
  });

  if (!entry) {
    throw new TransactionError(404, textT?.errors?.packageNotFound);
  }

  // processing logic
  const result = await tx.cusPackage.update({
    where: { id: entry.id },
    data: {
      billing_weight: weight,
      billing_pound_fee: entry.client ? entry.client.pound_fee : undefined,
      billing_amount: entry.client ? calculateShippingPrice(weight.toString(), entry.client.pound_fee) : undefined,
      location_shelf: ready ? shelf : null,
      location_row: ready ? row : null,
      status: ready ? PackageStatus.READY : undefined,
      status_date: ready ? new Date() : undefined
    }
  });

  if (!result) {
    throw new TransactionError(400, textT?.errors?.save);
  }

  // save log
  await tx.cusPackageLog.create({
    data: {
      package_id: entry.id,
      administrator_id: admin_id,
      action: 'package.reception',
      data: JSON.stringify({ entry, updates: data })
    }
  });

  // save cut number log
  await tx.cusCutLog.create({
    data: {
      package_id: entry.id,
      number: cut_number,
      tracking: entry.tracking,
      weight: weight
    }
  });

  if (ready) {
    // save status log
    await tx.cusPackageStatusLog.create({
      data: {
        package_id: entry.id,
        status: PackageStatus.READY
      }
    });

    // TODO: send notification to client
  }

  return true;
};

const saveOrderReception = async (
  tx: Prisma.TransactionClient,
  data: {
    cut_number: string;
    order_id: number;
    tracking: string;
    weight: number;
    shelf: string;
    row: string;
  },
  admin_id: number,
  textT: any
) => {
  const { cut_number, order_id, tracking, weight, shelf, row } = data;
  const ready = shelf !== '' && row !== '';

  const entry = await tx.cusOrder.findUnique({
    where: {
      id: order_id,
      products: { some: { tracking, AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }] } },
      AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }]
    },
    select: {
      id: true,
      client: { select: { ...clientSelectSchema, pound_fee: true } },
      products: {
        where: { tracking, AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }] },
        select: {
          id: true,
          tracking: true
        }
      }
    }
  });

  if (!entry) {
    throw new TransactionError(404, textT?.errors?.orderNotFound);
  }

  // processing logic
  for (const product of entry.products) {
    const result = await tx.cusOrderProduct.update({
      where: { id: product.id },
      data: {
        location_shelf: ready ? shelf : null,
        location_row: ready ? row : null,
        status: ready ? OrderStatus.READY : undefined,
        status_date: ready ? new Date() : undefined
      }
    });

    if (result && ready) {
      // save status log
      await tx.cusOrderProductStatusLog.create({
        data: {
          order_product_id: product.id,
          status: OrderStatus.READY
        }
      });

      // TODO: send notification to client
    }
  }

  await tx.cusOrderPackage.create({
    data: {
      order_id: entry.id,
      tracking,
      billing_weight: weight,
      billing_pound_fee: entry.client ? entry.client.pound_fee : undefined,
      billing_amount: entry.client ? calculateShippingPrice(weight.toString(), entry.client.pound_fee) : undefined
    }
  });

  // save log
  await tx.cusOrderLog.create({
    data: {
      order_id: entry.id,
      administrator_id: admin_id,
      action: 'package.reception',
      data: JSON.stringify({ entry, updates: data })
    }
  });

  // save cut number log
  await tx.cusCutLog.create({
    data: {
      order_id: entry.id,
      number: cut_number,
      tracking: tracking,
      weight: weight
    }
  });

  return true;
};

const saveNewPackageReception = async (
  tx: Prisma.TransactionClient,
  data: {
    cut_number: string;
    tracking: string;
    client_id: number;
    weight: number;
    shelf: string;
    row: string;
  },
  admin_id: number,
  textT: any
) => {
  const { cut_number, tracking, client_id, weight, shelf, row } = data;
  const ready = shelf !== '' && row !== '';

  const client = await tx.cusClient.findUnique({
    where: { id: client_id },
    select: { ...clientSelectSchema, pound_fee: true }
  });

  if (!client) {
    throw new TransactionError(404, textT?.errors?.clientNotFound);
  }

  // processing logic
  const result = await tx.cusPackage.create({
    data: {
      client_id: client.id,
      tracking,
      courier_company: '',
      purchase_page: '',
      price: 0,
      description: '',
      notes: '',
      billing_weight: weight,
      billing_pound_fee: client.pound_fee,
      billing_amount: calculateShippingPrice(weight.toString(), client.pound_fee),
      location_shelf: ready ? shelf : null,
      location_row: ready ? row : null,
      status: ready ? PackageStatus.READY : PackageStatus.ON_THE_WAY,
      status_date: new Date()
    }
  });

  if (!result) {
    throw new TransactionError(400, textT?.errors?.save);
  }

  // save log
  await tx.cusPackageLog.create({
    data: {
      package_id: result.id,
      administrator_id: admin_id,
      action: 'package.reception',
      data: JSON.stringify({ entry: null, updates: data })
    }
  });

  // save status log
  await tx.cusPackageStatusLog.create({
    data: {
      package_id: result.id,
      status: ready ? PackageStatus.READY : PackageStatus.ON_THE_WAY
    }
  });

  // save cut number log
  await tx.cusCutLog.create({
    data: {
      package_id: result.id,
      number: cut_number,
      tracking: tracking,
      weight: weight
    }
  });

  if (ready) {
    // TODO: send notification to client
  }

  return true;
};

const markTrackingAsFound = async (tracking: string) => {
  try {
    const entry = await prismaRead.cusUnownedPackage.findUnique({
      where: { tracking, found: false }
    });

    if (!entry) {
      return true;
    }

    await prismaRead.cusUnownedPackage.update({
      where: { id: entry.id },
      data: { found: true }
    });

    return true;
  } catch (error) {
    console.error(`Error marking tracking as found: ${error}`);

    return false;
  }
};
