import { NextResponse } from 'next/server';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { Currency, OrderStatus, PackageStatus, Prisma } from '@/prisma/generated/client';

import { validateOrderStatus } from '@/controllers/Order.Controller';
import { getConfiguration } from '@/controllers/Configuration.Controller';
import { addTaxToAmount, calculateShippingPrice, convertCRC, getOrderProductPrice } from '@/helpers/calculations';
import { sendPackageReadyNotification } from '@/helpers/notificationHelper';

import { formatMoney } from '@/libs/utils';
import { currencies } from '@/libs/constants';

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
    const weight = data.weight || 0;
    const shelf = data.shelf || '';
    const row = data.row || '';
    const ready = shelf !== '' && row !== '';

    const client = await prismaRead.cusClient.findUnique({
      where: { id: Number(data.client_id) },
      include: { office: true }
    });
    if (!client) {
      return NextResponse.json({ valid: false, message: textT?.errors?.clientNotFound }, { status: 404 });
    }

    const result = await withTransaction(async (tx) => {
      let processResult;
      if (package_id && package_id !== '') {
        // Process package reception
        processResult = await savePackageReception(
          tx,
          {
            cut_number,
            package_id: Number(package_id),
            pound_fee: client.pound_fee,
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
            pound_fee: client.pound_fee,
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
            client_id: client.id,
            pound_fee: client.pound_fee,
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

    if (!result.valid) {
      throw new TransactionError(400, result.message || textT?.errors?.general);
    }

    // mark tracking as found if exists in unowned packages
    await markTrackingAsFound(tracking);

    if (order_id && order_id !== '') {
      // validate order status
      await validateOrderStatus(Number(order_id));
    }

    // send notification if needed
    if (result.notificationData) {
      await sendNotification(result.notificationData, client);
    }

    return NextResponse.json({ valid: true, tracking, ready }, { status: 200 });
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
    pound_fee: number;
    weight: number;
    shelf: string;
    row: string;
  },
  admin_id: number,
  textT: any
) => {
  const { cut_number, package_id, pound_fee, weight, shelf, row } = data;
  const ready = shelf !== '' && row !== '';
  let notificationData: { tracking: string; amount: number } | null = null;

  try {
    const entry = await tx.cusPackage.findUnique({
      where: { id: package_id, AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }] },
      select: { id: true, tracking: true }
    });
    if (!entry) {
      return { valid: false, message: textT?.errors?.packageNotFound };
    }

    // processing logic
    const result = await tx.cusPackage.update({
      where: { id: entry.id },
      data: {
        billing_weight: weight,
        billing_pound_fee: pound_fee,
        billing_amount: calculateShippingPrice(weight.toString(), pound_fee),
        location_shelf: ready ? shelf : null,
        location_row: ready ? row : null,
        status: ready ? PackageStatus.READY : undefined,
        status_date: ready ? new Date() : undefined
      }
    });
    if (!result) {
      return { valid: false, message: textT?.errors?.save };
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

      notificationData = { tracking: entry.tracking, amount: result.billing_amount };
    }

    return { valid: true, notificationData };
  } catch (error) {
    console.error(`Error in savePackageReception: ${error}`);

    return { valid: false, message: textT?.errors?.general };
  }
};

const saveOrderReception = async (
  tx: Prisma.TransactionClient,
  data: {
    cut_number: string;
    order_id: number;
    tracking: string;
    pound_fee: number;
    weight: number;
    shelf: string;
    row: string;
  },
  admin_id: number,
  textT: any
) => {
  const { cut_number, order_id, tracking, pound_fee, weight, shelf, row } = data;
  const ready = shelf !== '' && row !== '';
  let notificationData: { tracking: string; amount: number } | null = null;

  try {
    const entry = await tx.cusOrder.findUnique({
      where: {
        id: order_id,
        products: { some: { tracking, AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }] } },
        AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }]
      },
      select: {
        id: true,
        products: {
          where: { tracking, AND: [{ status: { not: 'READY' } }, { status: { not: 'DELIVERED' } }] }
        }
      }
    });
    if (!entry) {
      return { valid: false, message: textT?.errors?.orderNotFound };
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

        if (!notificationData) {
          notificationData = { tracking, amount: getOrderProductPrice(product) };
        } else {
          notificationData.amount += getOrderProductPrice(product);
        }
      }
    }

    await tx.cusOrderPackage.create({
      data: {
        order_id: entry.id,
        tracking,
        billing_weight: weight,
        billing_pound_fee: pound_fee,
        billing_amount: calculateShippingPrice(weight.toString(), pound_fee)
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

    return { valid: true, notificationData };
  } catch (error) {
    console.error(`Error in savePackageReception: ${error}`);

    return { valid: false, message: textT?.errors?.general };
  }
};

const saveNewPackageReception = async (
  tx: Prisma.TransactionClient,
  data: {
    cut_number: string;
    tracking: string;
    client_id: number;
    pound_fee: number;
    weight: number;
    shelf: string;
    row: string;
  },
  admin_id: number,
  textT: any
) => {
  const { cut_number, tracking, client_id, pound_fee, weight, shelf, row } = data;
  const ready = shelf !== '' && row !== '';
  let notificationData: { tracking: string; amount: number } | null = null;

  try {
    // processing logic
    const result = await tx.cusPackage.create({
      data: {
        client_id: client_id,
        tracking,
        courier_company: '',
        purchase_page: '',
        price: 0,
        description: '',
        notes: '',
        billing_weight: weight,
        billing_pound_fee: pound_fee,
        billing_amount: calculateShippingPrice(weight.toString(), pound_fee),
        location_shelf: ready ? shelf : null,
        location_row: ready ? row : null,
        status: ready ? PackageStatus.READY : PackageStatus.ON_THE_WAY,
        status_date: new Date()
      }
    });

    if (!result) {
      return { valid: false, message: textT?.errors?.save };
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
      notificationData = { tracking, amount: result.billing_amount };
    }

    return { valid: true, notificationData };
  } catch (error) {
    console.error(`Error in savePackageReception: ${error}`);

    return { valid: false, message: textT?.errors?.general };
  }
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

const sendNotification = async (notificationData: { tracking: string; amount: number }, client: any) => {
  const configuration = await getConfiguration();
  const amountUSD = addTaxToAmount(notificationData.amount, configuration?.iva_percentage || 0);
  const amountCRC = convertCRC(amountUSD, configuration?.selling_exchange_rate || 0);

  sendPackageReadyNotification({
    clientName: client.full_name,
    clientPhone: client.phone || '',
    clientEmail: client.email,
    clientMailbox: `${client.office.mailbox_prefix}${client.id}`,
    tracking: notificationData.tracking,
    amountUSD: formatMoney(amountUSD, `${currencies[Currency.USD].symbol} `),
    amountCRC: formatMoney(amountCRC, `${currencies[Currency.CRC].symbol} `)
  });
};
