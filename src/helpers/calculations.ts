import { Currency } from '@/prisma/generated/enums';

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

export const getOrderTotal = (products: any[], iva: number) => {
  const result = { subtotal: 0, total: 0 };

  try {
    products.forEach((product: any) => {
      const price = getOrderProductPrice(product);

      result.subtotal += price;
    });

    result.total = parseFloat((result.subtotal + result.subtotal * (iva / 100)).toFixed(2));

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

export const calculateBillingTotal = (lines: BillingLine[], conversionRate: number, taxPercentage: number) => {
  let amountCRC = 0;
  let amountUSD = 0;

  try {
    lines.forEach((line) => {
      if (line.currency === Currency.CRC) {
        amountCRC += line.total;
        amountUSD += convertUSD(line.total, conversionRate);
      } else if (line.currency === Currency.USD) {
        amountUSD += line.total;
        amountCRC += convertCRC(line.total, conversionRate);
      }
    });

    const totalsCRC = calculateTaxes(amountCRC, taxPercentage);
    const totalsUSD = calculateTaxes(amountUSD, taxPercentage);

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

export const roundCRC = (type: 'sell' | 'buy', amount: number): number => {
  if (type === 'buy') {
    return Math.floor(amount / 5) * 5;
  } else {
    return Math.ceil(amount / 5) * 5;
  }
};
