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
