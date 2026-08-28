import ProductCard from "./ProductCard";
import ProductGridBreaker from "./ProductGridBreaker";
import { motion, AnimatePresence } from "framer-motion";

const ProductGrid = ({ products, showBreaker = true }) => {
  const firstBatch = showBreaker && products.length > 8 ? products.slice(0, 8) : products;
  const secondBatch = showBreaker && products.length > 8 ? products.slice(8, 16) : [];

  return (
    <div
      className="
        grid
        grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        gap-3.5 sm:gap-6 lg:gap-8
        p-4 sm:p-6 lg:p-10
      "
    >
      {/* First 8 Products (2 Rows of 4) */}
      <AnimatePresence mode="popLayout">
        {firstBatch.map((product) => (
          <motion.div
            layout
            key={product.id || product.slug}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Promotional Mid-Grid Breaker after 8 Products */}
      {showBreaker && products.length > 8 && <ProductGridBreaker />}

      {/* Second 8 Products (2 Rows of 4) */}
      {secondBatch.length > 0 && (
        <AnimatePresence mode="popLayout">
          {secondBatch.map((product) => (
            <motion.div
              layout
              key={product.id || product.slug}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default ProductGrid;
