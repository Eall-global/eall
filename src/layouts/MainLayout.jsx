import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileBottomNav from "../components/navigation/MobileBottomNav";
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
    <div className="flex flex-col min-h-screen pb-16 xl:pb-0">
      <Header />

      {/* Push content below fixed header */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Persistent Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;
