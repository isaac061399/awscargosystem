import moment from 'moment';

import { prismaRead } from '@libs/prisma';
import { hasAllPermissions } from '@/helpers/permissions';
import { InvoicePaymentCondition, InvoiceStatus, OrderStatus } from '@/prisma/generated/enums';
import { paymentConditionsDays } from '@/libs/constants';

import { clientSelectSchema } from './Client.Controller';

export const getDashboardData = async (permissions: string[]) => {
  const result = {
    statistics: false ? await getStatistics() : null,
    admins: hasAllPermissions('administrators.list', permissions) ? await getAdmins() : null,
    pendingOrderProducts: hasAllPermissions('orders.list', permissions) ? await getPendingOrderProducts() : null,
    pendingInvoices: hasAllPermissions('invoices.list', permissions) ? await getPendingInvoices() : null
  };

  return result;
};

const getStatistics = async () => {
  try {
    const result = await Promise.all([
      prismaRead.cmsPage.count(),
      prismaRead.cmsCategory.count(),
      prismaRead.cmsContent.count(),
      prismaRead.cmsMenu.count()
    ]);

    const data = {
      pages: result[0],
      categories: result[1],
      contents: result[2],
      menus: result[3]
    };

    return data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return { pages: 0, categories: 0, contents: 0, menus: 0 };
  }
};

const getAdmins = async () => {
  try {
    const admins = await prismaRead.administrator.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        full_name: true,
        email: true,
        enabled_2fa: true,
        role: { select: { id: true, name: true } },
        user: { select: { id: true, enabled: true } }
      }
    });

    return admins;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};

const getPendingOrderProducts = async () => {
  try {
    const pendingOrderProducts = await prismaRead.cusOrderProduct.findMany({
      orderBy: [{ status_date: 'asc' }],
      where: {
        status: OrderStatus.PENDING
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        status_date: true,
        order: {
          select: {
            id: true,
            number: true,
            client: { select: clientSelectSchema }
          }
        }
      }
    });

    return pendingOrderProducts;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};

const getPendingInvoices = async () => {
  try {
    const pendingInvoices = await prismaRead.cusInvoice.findMany({
      orderBy: [{ id: 'asc' }],
      where: {
        payment_condition: { not: InvoicePaymentCondition.CASH },
        status: InvoiceStatus.PENDING
      },
      select: {
        id: true,
        consecutive: true,
        numeric_key: true,
        payment_condition: true,
        currency: true,
        total: true,
        created_at: true,
        client: {
          select: clientSelectSchema
        }
      }
    });

    return pendingInvoices.map((invoice) => {
      const overdueDate = moment(invoice.created_at).add(
        paymentConditionsDays[invoice.payment_condition as keyof typeof paymentConditionsDays] || 0,
        'days'
      );

      return {
        ...invoice,
        expired_at: overdueDate.toDate(),
        expired_days: moment().diff(overdueDate, 'days')
      };
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
