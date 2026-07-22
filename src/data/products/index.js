import appleProducts from "./apple";
import hmdProducts from "./hmd";
import hmdAccessories from "./hmd_accessories";
import nokiaProducts from "./nokia";
import samsungProducts from "./samsung";

export const products = [
  ...appleProducts,
  ...samsungProducts,
  ...hmdProducts,
  ...nokiaProducts,
  ...hmdAccessories,
];

export default products;
