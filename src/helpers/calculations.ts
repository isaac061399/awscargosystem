import { Currency, PaymentMethod } from '@/prisma/generated/enums';

export type BillingLine = {
  id: string;
  type: 'package' | 'order_product' | 'custom' | 'product';
  refObj: any | null;
  ref: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency: Currency;
  total: number;
};

export type PaymentLine = {
  id: string;
  currency: Currency;
  method: PaymentMethod;
  ref?: string;
  ref_bank?: string;
  amount: number;
};

export const getOrderProductPrice = (product: any) => {
  try {
    const price = product.price && !isNaN(product.price) ? parseFloat(product.price) : 0;
    const service = product.service_price && !isNaN(product.service_price) ? parseFloat(product.service_price) : 0;
    const quantity = product.quantity && !isNaN(product.quantity) ? parseInt(product.quantity) : 0;

    return parseFloat((price * quantity + service).toFixed(2));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating product price: ${error}`);

    return 0;
  }
};

export const getOrderTotal = (products: any[], conversionRate: number, taxPercentage: number) => {
  const result = {
    usd: { subtotal: 0, total: 0, items: [] as { subtotal: number; total: number }[] },
    crc: { subtotal: 0, total: 0, items: [] as { subtotal: number; total: number }[] }
  };

  try {
    products.forEach((product: any) => {
      const price = getOrderProductPrice(product);
      const priceTotal = parseFloat((price + price * (taxPercentage / 100)).toFixed(2));

      result.usd.items.push({ subtotal: price, total: priceTotal });
      result.usd.subtotal += price;

      const priceCRC = convertCRC(price, conversionRate);
      const priceTotalCRC = parseFloat((priceCRC + priceCRC * (taxPercentage / 100)).toFixed(2));

      result.crc.items.push({ subtotal: priceCRC, total: priceTotalCRC });
      result.crc.subtotal += priceCRC;
    });

    result.usd.total = parseFloat((result.usd.subtotal + result.usd.subtotal * (taxPercentage / 100)).toFixed(2));
    result.crc.total = parseFloat((result.crc.subtotal + result.crc.subtotal * (taxPercentage / 100)).toFixed(2));

    return result;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating order total: ${error}`);

    return result;
  }
};

export const calculateShippingPrice = (weight: string, poundFee: number) => {
  try {
    if (isNaN(parseFloat(weight)) || isNaN(poundFee) || parseFloat(weight) <= 0 || poundFee <= 0) {
      return 0;
    }

    const price = parseFloat(weight) * poundFee;

    return parseFloat(price.toFixed(2));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating shipping price: ${error}`);

    return 0;
  }
};

export const calculateTaxes = (amount: number, taxPercentage: number) => {
  const result = { subtotal: 0, taxes: 0, total: 0 };

  try {
    result.subtotal = amount;
    result.taxes = result.subtotal * (taxPercentage / 100);
    result.total = result.subtotal + result.taxes;

    return {
      subtotal: parseFloat(result.subtotal.toFixed(2)),
      taxes: parseFloat(result.taxes.toFixed(2)),
      total: parseFloat(result.total.toFixed(2))
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating shipping price: ${error}`);

    return result;
  }
};

export const calculateBillingTotal = (
  lines: BillingLine[],
  sellingConversionRate: number,
  buyingConversionRate: number,
  taxPercentage: number
) => {
  let amountCRC = 0;
  let amountUSD = 0;

  try {
    // calculate subtotals
    lines.forEach((line) => {
      if (line.currency === Currency.CRC) {
        amountCRC += line.total;
        amountUSD += convertUSD(line.total, buyingConversionRate);
      } else if (line.currency === Currency.USD) {
        amountUSD += line.total;
        amountCRC += convertCRC(line.total, sellingConversionRate);
      }
    });

    // calculate taxes and totals
    const totalsCRC = calculateTaxes(amountCRC, taxPercentage);
    const totalsUSD = calculateTaxes(amountUSD, taxPercentage);

    // round CRC totals
    totalsCRC.total = roundCRC(totalsCRC.total);

    return {
      [Currency.CRC]: totalsCRC,
      [Currency.USD]: totalsUSD
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating billing total: ${error}`);

    return {
      [Currency.CRC]: { subtotal: 0, taxes: 0, total: 0 },
      [Currency.USD]: { subtotal: 0, taxes: 0, total: 0 }
    };
  }
};

export const calculateBillingPaidAmount = (paymentLines: PaymentLine[], sellingConversionRate: number) => {
  let paidAmountCRC = 0;
  let paidAmountUSD = 0;

  try {
    // calculate paid amounts
    paymentLines.forEach((payment) => {
      if (payment.currency === Currency.CRC) {
        paidAmountCRC += payment.amount;
        paidAmountUSD += convertUSD(payment.amount, sellingConversionRate);
      } else if (payment.currency === Currency.USD) {
        paidAmountUSD += payment.amount;
        paidAmountCRC += convertCRC(payment.amount, sellingConversionRate);
      }
    });

    // round CRC totals
    paidAmountCRC = roundCRC(paidAmountCRC);

    return {
      [Currency.CRC]: paidAmountCRC,
      [Currency.USD]: paidAmountUSD
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating billing total: ${error}`);

    return {
      [Currency.CRC]: 0,
      [Currency.USD]: 0
    };
  }
};

export const convertCRC = (amount: number, conversionRate: number): number => {
  try {
    if (isNaN(amount) || isNaN(conversionRate) || amount <= 0 || conversionRate <= 0) {
      return 0;
    }

    return amount * conversionRate;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating conversion rate: ${error}`);

    return 0;
  }
};

export const convertUSD = (amount: number, rate: number): number => {
  try {
    if (isNaN(amount) || isNaN(rate) || amount <= 0 || rate <= 0) {
      return 0;
    }

    const convertedAmount = amount / rate;

    return parseFloat(convertedAmount.toFixed(2));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating conversion rate: ${error}`);

    return 0;
  }
};

export const roundCRC = (amount: number): number => {
  const newAmount = Math.round(amount);

  return Math.round(newAmount / 5) * 5;
};
