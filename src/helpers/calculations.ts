export const getOrderTotal = (products: any[], iva: number) => {
  const result = { subtotal: 0, total: 0 };

  try {
    products.forEach((product: any) => {
      const quantity = product.quantity && !isNaN(product.quantity) ? parseInt(product.quantity) : 0;
      const price = product.price && !isNaN(product.price) ? parseFloat(product.price) : 0;
      const servicePrice =
        product.service_price && !isNaN(product.service_price) ? parseFloat(product.service_price) : 0;
      result.subtotal += quantity * price + servicePrice;
    });

    result.total = result.subtotal + result.subtotal * (iva / 100);

    return {
      subtotal: parseFloat(result.subtotal.toFixed(2)),
      total: parseFloat(result.total.toFixed(2))
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating order total: ${error}`);

    return result;
  }
};

export const calculateShippingPrice = (weight: string, poundFee: number): number => {
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

export const calculateShippingTotal = (amount: number, iva: number) => {
  const result = { subtotal: 0, total: 0 };

  try {
    result.subtotal = amount;
    result.total = result.subtotal + result.subtotal * (iva / 100);

    return {
      subtotal: parseFloat(result.subtotal.toFixed(2)),
      total: parseFloat(result.total.toFixed(2))
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating shipping price: ${error}`);

    return result;
  }
};

export const convertCRC = (type: 'sell' | 'buy', amount: number, rate: number): number => {
  try {
    if (isNaN(amount) || isNaN(rate) || amount <= 0 || rate <= 0) {
      return 0;
    }

    const convertedAmount = amount * rate;

    if (type === 'buy') {
      return Math.floor(convertedAmount / 5) * 5;
    } else {
      return Math.ceil(convertedAmount / 5) * 5;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`Error calculating conversion rate: ${error}`);

    return 0;
  }
};
