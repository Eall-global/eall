import CouponTicketStrip, {
  useLocalizedCoupons,
} from "../common/CouponTicketStrip";

const LiveCouponsBanner = () => {
  const coupons = useLocalizedCoupons();
  if (!coupons.length) return null;

  return (
    <section className="py-4 sm:py-6 bg-white text-left">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <CouponTicketStrip coupons={coupons.slice(0, 2)} />
      </div>
    </section>
  );
};

export default LiveCouponsBanner;
