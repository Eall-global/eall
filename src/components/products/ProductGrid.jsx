import ProductCard from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";

const ProductGrid = ({ products }) => {
  return (
    <div
      className="
        grid
        grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        gap-4 lg:gap-8
        p-6
        lg:p-10
      "
    >
      <AnimatePresence mode="popLayout">
        {products.map((product) => (
          <motion.div
            layout
            key={product.id}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            transition={{ duration: 0.25 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ProductGrid;
