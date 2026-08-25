import appleProducts from "./apple";

import hmdNokiaProducts from "./hmd-nokia-products";
import hmdAccessories from "./hmd_accessories";
import newPhoneProducts from "./new-phone-products";
import nokiaProducts from "./nokia";
import samsungAccessories from "./samsung_accessories";
import samsungMobiles from "./samsung_mobiles";
import samsungTablets from "./samsung_tablets";

export const products = [
  ...appleProducts,
  ...nokiaProducts,
  ...hmdAccessories,
  ...hmdNokiaProducts,
  ...newPhoneProducts,

  ...samsungMobiles,
  ...samsungAccessories,
  ...samsungTablets,
].filter(Boolean);

export default products;
