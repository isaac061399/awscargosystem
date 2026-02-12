import { CusCashRegisterLine, CusOrderProduct, CusPackage, CusProduct } from '@/prisma/generated/client';
import { Currency, PaymentMethod } from '@/prisma/generated/enums';
import { poundToKgRate } from '@/libs/constants';

export type BillingLine = {
  id: string;
  refObj:
    | { type: 'package'; obj: CusPackage }
    | { type: 'order_product'; obj: CusOrderProduct }
    | { type: 'product'; obj: CusProduct };
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

    let price = parseFloat(weight) * poundFee;

    // ensure minimum fee of one pound
    if (price < poundFee) {
      price = poundFee;
    }

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
  baseCurrency: Currency,
  sellingConversionRate: number,
  buyingConversionRate: number,
  taxPercentage: number
) => {
  let amount = 0;

  try {
    // calculate subtotals
    lines.forEach((line) => {
      if (line.currency === baseCurrency) {
        amount += line.total;
      } else if (line.currency !== baseCurrency) {
        if (baseCurrency === Currency.CRC) {
          amount += convertCRC(line.total, sellingConversionRate);
        } else if (baseCurrency === Currency.USD) {
          amount += convertUSD(line.total, buyingConversionRate);
        }
      }
    });

    // calculate taxes and totals
    const totals = calculateTaxes(amount, taxPercentage);

    // round CRC totals
    if (baseCurrency === Currency.CRC) {
      totals.total = roundCRC(totals.total);
    }

    return totals;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating billing total: ${error}`);

    return { subtotal: 0, taxes: 0, total: 0 };
  }
};

export const calculateBillingPaidAmount = (
  paymentLines: PaymentLine[],
  baseCurrency: Currency,
  sellingConversionRate: number,
  buyingConversionRate: number
) => {
  let paidAmount = 0;

  try {
    // calculate paid amounts
    paymentLines.forEach((payment) => {
      if (payment.currency === baseCurrency) {
        paidAmount += payment.amount;
      } else if (payment.currency !== baseCurrency) {
        if (baseCurrency === Currency.CRC) {
          paidAmount += convertCRC(payment.amount, buyingConversionRate);
        } else if (baseCurrency === Currency.USD) {
          paidAmount += convertUSD(payment.amount, sellingConversionRate);
        }
      }
    });

    // round CRC totals
    if (baseCurrency === Currency.CRC) {
      paidAmount = roundCRC(paidAmount);
    }

    return paidAmount;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating billing total: ${error}`);

    return 0;
  }
};

export const calculateBillingChangeAmount = (
  paidAmount: number,
  billingTotal: number,
  baseCurrency: Currency,
  buyingConversionRate: number
) => {
  let changeAmount = 0;

  try {
    changeAmount = paidAmount - billingTotal;

    if (changeAmount < 0) {
      return 0;
    }

    if (baseCurrency === Currency.USD) {
      changeAmount = convertCRC(changeAmount, buyingConversionRate);
      changeAmount = roundCRC(changeAmount);
    }

    return changeAmount;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating billing change amount: ${error}`);

    return 0;
  }
};

export const addTaxToAmount = (amount: number, taxPercentage: number): number => {
  try {
    if (isNaN(amount) || isNaN(taxPercentage) || amount <= 0 || taxPercentage < 0) {
      return 0;
    }

    const totalAmount = amount + amount * (taxPercentage / 100);

    return parseFloat(totalAmount.toFixed(2));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error adding tax to amount: ${error}`);

    return 0;
  }
};

export const convertCRC = (amount: number, conversionRate: number): number => {
  try {
    if (isNaN(amount) || isNaN(conversionRate) || amount <= 0 || conversionRate <= 0) {
      return 0;
    }

    const convertedAmount = amount * conversionRate;

    return parseFloat(convertedAmount.toFixed(2));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating conversion rate: ${error}`);

    return 0;
  }
};

export const convertUSD = (amount: number, conversionRate: number): number => {
  try {
    if (isNaN(amount) || isNaN(conversionRate) || amount <= 0 || conversionRate <= 0) {
      return 0;
    }

    const convertedAmount = amount / conversionRate;

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

export const calculateCashRegisterTotals = (line: CusCashRegisterLine) => {
  const response = {
    in: 0,
    out: 0,
    change: 0,
    cash: {
      reported: 0,
      system: 0,
      difference: 0
    }
  };

  const l = {
    cash_reported: line.cash_reported || 0,
    cash_balance: line.cash_balance || 0,
    cash_in: line.cash_in || 0,
    sinpe_in: line.sinpe_in || 0,
    transfer_in: line.transfer_in || 0,
    card_in: line.card_in || 0,
    cash_out: line.cash_out || 0,
    sinpe_out: line.sinpe_out || 0,
    transfer_out: line.transfer_out || 0,
    card_out: line.card_out || 0,
    cash_change: line.cash_change || 0,
    sinpe_change: line.sinpe_change || 0,
    transfer_change: line.transfer_change || 0,
    card_change: line.card_change || 0
  };

  response.in = l.cash_in + l.sinpe_in + l.transfer_in + l.card_in;
  response.out = l.cash_out + l.sinpe_out + l.transfer_out + l.card_out;
  response.change = l.cash_change + l.sinpe_change + l.transfer_change + l.card_change;

  response.cash.reported = l.cash_reported;
  response.cash.system = l.cash_balance + l.cash_in - l.cash_out - l.cash_change;
  response.cash.difference = response.cash.reported - Math.abs(response.cash.system);

  return response;
};

export const calculateManifestTotal = (quantity: number, amountPerPackage: number, amountPerManifest: number) => {
  try {
    if (
      isNaN(quantity) ||
      isNaN(amountPerPackage) ||
      isNaN(amountPerManifest) ||
      quantity < 0 ||
      amountPerPackage < 0 ||
      amountPerManifest < 0
    ) {
      return 0;
    }

    const total = quantity * amountPerPackage + amountPerManifest;

    return parseFloat(total.toFixed(2));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating manifest total: ${error}`);

    return 0;
  }
};

export const convertPoundToKg = (pound: number) => {
  try {
    if (isNaN(pound) || pound < 0) {
      return 0;
    }

    const kg = pound * poundToKgRate;

    return parseFloat(kg.toFixed(2));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error converting pound to kg: ${error}`);

    return 0;
  }
};
