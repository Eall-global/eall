import appleProducts from "./apple";
import hmdNokiaProducts from "./hmd-nokia-products";
import hmdAccessories from "./hmd_accessories";
import newPhoneProducts from "./new-phone-products";
import nokiaProducts from "./nokia";
import samsungAccessories from "./samsung_accessories";
import samsungMobiles from "./samsung_mobiles";
import samsungTablets from "./samsung_tablets";

const rawProducts = [
  ...appleProducts,
  ...nokiaProducts,
  ...hmdAccessories,
  ...hmdNokiaProducts,
  ...newPhoneProducts,
  ...samsungMobiles,
  ...samsungAccessories,
  ...samsungTablets,
].filter(Boolean);

// Deduplicate products by unique slug/id
const seen = new Set();
export const products = rawProducts.filter((p) => {
  const key = p.slug || p.id;
  if (!key || seen.has(key)) return false;
  seen.add(key);
  return true;
});

export default products;
