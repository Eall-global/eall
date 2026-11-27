import { useState } from "react";
import EcommerceHero from "../components/home/EcommerceHero";
import MerchandisingShelf from "../components/home/MerchandisingShelf";
import DualChannelSection from "../components/home/DualChannelSection";
import BrandAndImeiSection from "../components/home/BrandAndImeiSection";
import Testimonials from "../components/home/Testimonials";
import QuickRfqModal from "../components/home/QuickRfqModal";

const Home = () => {
  const [rfqState, setRfqState] = useState({ open: false, product: "" });

  const openRfqModal = (productName = "") => {
    setRfqState({ open: true, product: productName });
  };

  return (
    <div className="bg-white w-full">
      {/* 1. FULL-WIDTH 4-COLUMN COMMERCE MOSAIC + NOON-STYLE VISUAL QUICK-SHOP STRIP */}
      <EcommerceHero onOpenRfq={openRfqModal} />

      {/* 2. LIVE TABBED MERCHANDISING SHELF WITH INTERLEAVED COUPON TICKET STRIPS */}
      <MerchandisingShelf />

      {/* 3. DUAL-CHANNEL RETAIL VS. WHOLESALE B2B SPLIT */}
      <DualChannelSection onOpenRfq={openRfqModal} />

      {/* 4. OFFICIAL BRAND SHOWCASE + IMEI WARRANTY VERIFIER */}
      <BrandAndImeiSection />

      {/* 5. VERIFIED RETAIL & WHOLESALE REVIEWS */}
      <Testimonials />

      {/* INSTANT B2B WHOLESALE RFQ MODAL (WIRED TO PORTAL B2B QUOTES) */}
      <QuickRfqModal
        key={rfqState.open ? rfqState.product || "open" : "closed"}
        isOpen={rfqState.open}
        initialProduct={rfqState.product}
        onClose={() => setRfqState({ open: false, product: "" })}
      />
    </div>
  );
};

export default Home;
