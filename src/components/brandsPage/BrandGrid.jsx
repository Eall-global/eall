import { motion, AnimatePresence } from "framer-motion";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

import BrandCard from "./BrandCard";

const BrandGrid = ({ brands }) => {
  return (
    <div className="mt-10 grid md:grid-cols-2 xl:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {brands.map((brand) => (
          <motion.div
            key={brand.slug}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
          >
            <BrandCard brand={brand} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BrandGrid;
