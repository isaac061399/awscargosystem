import { Currency, OrderStatus, PackageStatus, PaymentStatus } from '@/prisma/generated/enums';
import { BillingLine, convertCRC, getOrderProductPrice, PaymentLine } from '@/helpers/calculations';
import { prismaRead, Tx } from '@/libs/prisma';
import { clientSelectSchema } from './Client.Controller';

export const getInvoice = async (id: number) => {
  try {
    const invoice = await prismaRead.cusInvoice.findUnique({
      where: { id },
      select: {
        id: true,
        consecutive: true,
        numeric_key: true,
        type: true,
        payment_condition: true,
        iva_percentage: true,
        selling_exchange_rate: true,
        buying_exchange_rate: true,
        currency: true,
        payment_method: true,
        subtotal: true,
        tax: true,
        total: true,
        cash_change: true,
        status: true,
        cancelled_at: true,
        created_at: true,
        cancelled_by: {
          select: { id: true, full_name: true, email: true }
        },
        cash_register: {
          select: { id: true, office: { select: { id: true, name: true } } }
        },
        client: {
          select: clientSelectSchema
        },
        invoice_lines: {
          select: {
            id: true,
            package_id: true,
            order_product_id: true,
            product_id: true,
            package_prev_state: true,
            order_product_prev_state: true,
            prev_payment_status: true,
            currency: true,
            quantity: true,
            unit_price: true,
            total: true,
            package: { select: { id: true, tracking: true, description: true } },
            order_product: { select: { id: true, order_id: true, tracking: true, name: true, quantity: true } },
            product: { select: { id: true, code: true, name: true } }
          }
        },
        invoice_payments: {
          select: {
            currency: true,
            payment_method: true,
            ref: true,
            ref_bank: true,
            amount: true
          }
        }
      }
    });

    if (!invoice) {
      return;
    }

    return invoice;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // console.error(`Error: ${e}`);
    return;
  }
};

export const validateLines = async (
  lines: any[]
): Promise<{ valid: boolean; data?: BillingLine[]; errors?: string[] }> => {
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return { valid: false, errors: ['No se han proporcionado líneas de facturación'] };
  }

  const errors: string[] = [];
  const data: BillingLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.package_id) {
      const pkg = await prismaRead.cusPackage.findUnique({
        where: { id: parseInt(line.package_id), status: PackageStatus.READY, payment_status: PaymentStatus.PENDING }
      });

      if (!pkg) {
        errors.push(`Paquete inválido en la línea ${i + 1}`);
        continue;
      }

      data.push({
        id: `line-${i + 1}`,
        refObj: { type: 'package', obj: pkg },
        ref: pkg.tracking,
        description: pkg.description || '',
        quantity: 1,
        unit_price: pkg.billing_amount,
        currency: Currency.USD,
        total: pkg.billing_amount
      });
    } else if (line.order_product_id) {
      const orderProduct = await prismaRead.cusOrderProduct.findUnique({
        where: { id: parseInt(line.order_product_id), payment_status: PaymentStatus.PENDING }
      });

      if (!orderProduct) {
        errors.push(`Pedido inválido en la línea ${i + 1}`);
        continue;
      }

      const price = getOrderProductPrice(orderProduct);

      data.push({
        id: `line-${i + 1}`,
        refObj: { type: 'order_product', obj: orderProduct },
        ref: orderProduct.tracking || '',
        description: `${orderProduct.quantity} x ${orderProduct.name}`,
        quantity: 1,
        unit_price: price,
        currency: Currency.USD,
        total: price
      });
    } else if (line.product_id) {
      const product = await prismaRead.cusProduct.findUnique({
        where: { id: parseInt(line.product_id), enabled: true }
      });

      if (!product) {
        errors.push(`Producto inválido en la línea ${i + 1}`);
        continue;
      }

      const quantity = line.quantity && !isNaN(line.quantity) ? parseInt(line.quantity) : 1;

      data.push({
        id: `line-${i + 1}`,
        refObj: { type: 'product', obj: product },
        ref: product.code,
        description: product.name,
        quantity: quantity,
        unit_price: product.price,
        currency: product.currency,
        total: product.price * quantity
      });
    } else {
      errors.push(`Línea inválida en la línea ${i + 1}`);
    }
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
};

export const validatePayments = (payments: any[]): { valid: boolean; data?: PaymentLine[]; errors?: string[] } => {
  if (!payments || !Array.isArray(payments) || payments.length === 0) {
    return { valid: false, errors: ['No se han proporcionado pagos'] };
  }

  const errors: string[] = [];
  const data: PaymentLine[] = [];
  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i];

    if (!payment.currency) {
      errors.push(`Moneda inválida en el pago ${i + 1}`);
      continue;
    }

    if (!payment.method) {
      errors.push(`Método de pago inválido en el pago ${i + 1}`);
      continue;
    }

    if (!payment.amount || isNaN(payment.amount)) {
      errors.push(`Monto de pago inválido en el pago ${i + 1}`);
      continue;
    }

    data.push({
      id: `payment-${i + 1}`,
      currency: payment.currency,
      method: payment.method,
      ref: payment.ref || '',
      ref_bank: payment.ref_bank || '',
      amount: parseFloat(payment.amount)
    });
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
};

export const getMostValuablePayment = (payments: PaymentLine[], buyingConversionRate: number): PaymentLine => {
  const baseCurrency = Currency.CRC;
  let mostValuable = payments[0];
  let mostValuableAmount = 0;

  payments.forEach((payment) => {
    const amount =
      payment.currency === baseCurrency ? payment.amount : convertCRC(payment.amount, buyingConversionRate);

    if (amount > mostValuableAmount) {
      mostValuable = payment;
      mostValuableAmount = amount;
    }
  });

  return mostValuable;
};

export const updateLineReferences = async (lines: BillingLine[], tx: Tx): Promise<boolean> => {
  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.refObj.type === 'package') {
        // save status
        await tx.cusPackage.update({
          where: { id: line.refObj.obj.id },
          data: {
            payment_status: PaymentStatus.PAID,
            status: PackageStatus.DELIVERED,
            status_date: new Date()
          }
        });

        // save status log
        await tx.cusPackageStatusLog.create({
          data: {
            package_id: line.refObj.obj.id,
            status: PackageStatus.DELIVERED
          }
        });
      } else if (line.refObj.type === 'order_product') {
        // save status
        await tx.cusOrderProduct.update({
          where: { id: line.refObj.obj.id },
          data: {
            payment_status: PaymentStatus.PAID,
            status: line.refObj.obj.status === OrderStatus.READY ? OrderStatus.DELIVERED : undefined,
            status_date: line.refObj.obj.status === OrderStatus.READY ? new Date() : undefined
          }
        });

        // save status log
        if (line.refObj.obj.status === OrderStatus.READY) {
          await tx.cusOrderProductStatusLog.create({
            data: {
              order_product_id: line.refObj.obj.id,
              status: OrderStatus.DELIVERED
            }
          });
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Error: ${error}`);

    return false;
  }
};
