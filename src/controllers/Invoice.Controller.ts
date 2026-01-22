import { Currency, PackageStatus, PaymentStatus } from '@/prisma/generated/enums';
import { BillingLine, getOrderProductPrice, PaymentLine } from '@/helpers/calculations';
import { prismaRead } from '@/libs/prisma';

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
        type: 'package',
        refObj: pkg,
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
        type: 'order_product',
        refObj: orderProduct,
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
        type: 'product',
        refObj: product,
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
