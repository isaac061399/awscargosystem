export const getOrderTotal = (products: any[]) => {
  const total = products.reduce((total: number, product: any) => {
    if (!product.service_price || isNaN(product.service_price)) {
      return total;
    }

    return total + product.service_price;
  }, 0);

  return total.toFixed(2);
};
