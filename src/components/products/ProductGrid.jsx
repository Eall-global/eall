import { Fragment } from "react";
import ProductCard from "./ProductCard";
import ProductGridBreaker from "./ProductGridBreaker";
import CouponTicketStrip, {
  useLocalizedCoupons,
} from "../common/CouponTicketStrip";
import { motion, AnimatePresence } from "framer-motion";

const ProductGrid = ({ products, showBreaker = true }) => {
  const activeCoupons = useLocalizedCoupons();
  const hasCoupons = showBreaker && activeCoupons.length > 0;

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-4">
      <AnimatePresence mode="popLayout">
        {products.map((product, idx) => (
          <Fragment key={product.id || product.slug}>
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
            >
              <ProductCard product={product} />
            </motion.div>

            {/* Mobile (< sm, 2/row): 1 SINGLE ticket after Row 2 (idx 3), Row 4 (idx 7), Row 6 (idx 11) */}
            {hasCoupons && idx === 3 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(0, 1)}
                className="sm:hidden my-1"
              />
            )}
            {hasCoupons && idx === 7 && activeCoupons.length > 1 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(1, 2)}
                className="sm:hidden my-1"
              />
            )}
            {hasCoupons && idx === 11 && activeCoupons.length > 2 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(2, 3)}
                className="sm:hidden my-1"
              />
            )}

            {/* Tablet sm (3/row): Twin strip after Row 2 (idx 5) & Row 4 (idx 11) */}
            {hasCoupons && idx === 5 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(0, 2)}
                className="hidden sm:block lg:hidden my-1.5"
              />
            )}
            {hasCoupons && idx === 11 && activeCoupons.length > 2 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(2, 4)}
                className="hidden sm:block lg:hidden my-1.5"
              />
            )}

            {/* Laptop lg (4/row): Twin strip after Row 2 (idx 7) & Row 4 (idx 15) */}
            {hasCoupons && idx === 7 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(0, 2)}
                className="hidden lg:block xl:hidden my-1.5"
              />
            )}
            {hasCoupons && idx === 15 && activeCoupons.length > 2 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(2, 4)}
                className="hidden lg:block xl:hidden my-1.5"
              />
            )}

            {/* Desktop xl+ (6/row): Twin strip strictly after Row 2 (idx 11) & Row 4 (idx 23) */}
            {hasCoupons && idx === 11 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(0, 2)}
                className="hidden xl:block my-2"
              />
            )}
            {hasCoupons && idx === 23 && activeCoupons.length > 2 && (
              <CouponTicketStrip
                coupons={activeCoupons.slice(2, 4)}
                className="hidden xl:block my-2"
              />
            )}

            {/* Promotional Mid-Grid Breaker after Row 3 on xl+ when catalog has 18+ items */}
            {showBreaker && idx === 17 && products.length > 18 && (
              <ProductGridBreaker />
            )}
          </Fragment>
        ))}
      </AnimatePresence>

      {/* Graceful fallback when page has fewer items than 2 full rows at the active breakpoint */}
      {hasCoupons && products.length > 0 && products.length < 4 && (
        <CouponTicketStrip
          coupons={activeCoupons.slice(0, 1)}
          className="sm:hidden my-1"
        />
      )}
      {hasCoupons && products.length > 0 && products.length < 6 && (
        <CouponTicketStrip
          coupons={activeCoupons.slice(0, 2)}
          className="hidden sm:block lg:hidden my-1.5"
        />
      )}
      {hasCoupons && products.length > 0 && products.length < 8 && (
        <CouponTicketStrip
          coupons={activeCoupons.slice(0, 2)}
          className="hidden lg:block xl:hidden my-1.5"
        />
      )}
      {hasCoupons && products.length > 0 && products.length < 12 && (
        <CouponTicketStrip
          coupons={activeCoupons.slice(0, 2)}
          className="hidden xl:block my-2"
        />
      )}
    </div>
  );
};

export default ProductGrid;
