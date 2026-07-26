export const getDefaultVariant = (product) => {
  if (product.variants?.length) {
    return product.variants.find((v) => v.isDefault) ?? product.variants[0];
  }
  return {
    color: null,
    colorSlug: null,
    sku: product.sku,
    image: product.image,
    gallery: product.gallery || [],
  };
};
