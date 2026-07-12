export interface Ga4Item {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_brand?: string;
  item_variant?: string;
  index?: number;
  item_list_name?: string;
  item_list_id?: string;
  coupon?: string;
  discount?: number;
}

/**
 * Maps any product shape (from Cart or Catalog) to the standard GA4 item schema.
 */
export function mapProductToGa4Item(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  productData: any,
  overrides?: Partial<Ga4Item>
): Ga4Item {
  // If productData is a CartItem, it has nested `product` object
  const isCartItem = !!productData.product && !!productData.productId;
  
  const id = isCartItem ? productData.productId : productData.id;
  const name = isCartItem ? productData.product.name : productData.name;
  const brand = isCartItem ? productData.product.brand : productData.brand;
  
  // Try category from nested shape or flat shape
  const category = isCartItem 
    ? productData.product.category?.name 
    : productData.category?.name || productData.categoryName;
    
  // Base price in paise
  const basePricePaise = isCartItem ? productData.product.basePricePaise : productData.basePricePaise;
  
  // Variant delta price
  let deltaPaise = 0;
  if (isCartItem && productData.variant) {
    deltaPaise = productData.variant.priceDeltaPaise;
  } else if (overrides?.item_variant && Array.isArray(productData.variants)) {
    // If a variant is selected in PDP, find its delta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchedVariant = productData.variants.find((v: any) => v.id === overrides.item_variant || v.sku === overrides.item_variant || v.name === overrides.item_variant);
    if (matchedVariant) {
      deltaPaise = matchedVariant.priceDeltaPaise;
    }
  }

  const finalPrice = ((basePricePaise + deltaPaise) / 100);

  // Variant name/sku
  const variant = isCartItem 
    ? productData.variant?.sku || productData.variant?.name || productData.variant?.id
    : overrides?.item_variant;

  // Quantity
  const quantity = isCartItem ? productData.quantity : 1;

  const item: Ga4Item = {
    item_id: id,
    item_name: name,
    price: Number(finalPrice.toFixed(2)),
    quantity: overrides?.quantity !== undefined ? overrides.quantity : quantity,
  };

  if (category) item.item_category = category;
  if (brand) item.item_brand = brand;
  if (variant) item.item_variant = variant;

  return {
    ...item,
    ...overrides,
  };
}
