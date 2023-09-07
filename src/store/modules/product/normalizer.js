
export const productsMapper = function(products) {
  let result = [];

  result = {
    ...result,
    ...products.reduce(
      (prev, product) => ({
        ...prev,
        [product.id]: productMapper(product)
      }),
      {}
    )
  };

  return result;
};

export const productMapper = product => ({
  id: product.id,
  name: product.name,
  categoryId: product.categoryId,
  description: product.description,
  price: product.price,
  status: product.status,
  quantity: product.quantity
});

export const propertyMapper = property => ({
  id: property.id ? property.id : null,
  value: property.value ? property.value : null
});
