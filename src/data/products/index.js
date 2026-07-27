import appleProducts from "./apple";
import hmdProducts from "./hmd";
import hmdAccessories from "./hmd_accessories";
import nokiaProducts from "./nokia";
import samsungAccessories from "./samsung_accessories";
import samsungMobiles from "./samsung_mobiles";
import samsungTablets from "./samsung_tablets";

export const products = [
  ...appleProducts,
  ...hmdProducts,
  ...nokiaProducts,
  ...hmdAccessories,

  ...samsungMobiles,
  ...samsungAccessories,
  ...samsungTablets,
];

export default products;
