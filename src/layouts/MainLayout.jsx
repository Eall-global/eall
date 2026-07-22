import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
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
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Push content below fixed header */}
      <main className="flex-1 ">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
