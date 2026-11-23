import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileBottomNav from "../components/navigation/MobileBottomNav";
import WishlistDrawer from "../components/wishlist/WishlistDrawer";
import CartDrawer from "../components/cart/CartDrawer";
import AuthModal from "../components/auth/AuthModal";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

const MainLayout = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname, location.search]);

  return (
    <div className="flex flex-col min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] xl:pb-0">
      <Header />

      {/* Push content below fixed header */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Desktop Footer only — Mobile uses persistent Bottom Nav + Account Support Hub */}
      <div className="hidden xl:block">
        <Footer />
      </div>

      {/* Persistent Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Wishlist Drawer */}
      <WishlistDrawer />

      {/* Global Shopping Cart Drawer */}
      <CartDrawer />

      {/* Global Customer Auth Modal */}
      <AuthModal />
    </div>
  );
};

export default MainLayout;
