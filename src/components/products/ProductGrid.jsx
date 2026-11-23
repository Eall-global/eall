import ProductCard from "./ProductCard";
import ProductGridBreaker from "./ProductGridBreaker";
import { motion, AnimatePresence } from "framer-motion";

const ProductGrid = ({ products, showBreaker = true }) => {
  const splitIdx = 12;
  const firstBatch =
    showBreaker && products.length > splitIdx
      ? products.slice(0, splitIdx)
      : products;
  const secondBatch =
    showBreaker && products.length > splitIdx
      ? products.slice(splitIdx, 24)
      : [];

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4">
      {/* First 12 Products */}
      <AnimatePresence mode="popLayout">
        {firstBatch.map((product) => (
          <motion.div
            layout
            key={product.id || product.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Promotional Mid-Grid Breaker after 12 Products */}
      {showBreaker && products.length > splitIdx && <ProductGridBreaker />}

      {/* Remaining Products */}
      {secondBatch.length > 0 && (
        <AnimatePresence mode="popLayout">
          {secondBatch.map((product) => (
            <motion.div
              layout
              key={product.id || product.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
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
