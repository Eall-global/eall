import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import BrandPage from "../pages/brands/BrandPage";
import ProductDetailPage from "../pages/products/ProductDetailPage";
import Contact from "../pages/Contact";
import BrandsPage from "../pages/brands/BrandsPage";
import AllProductsPage from "../pages/products/AllProductsPage";
import AboutPage from "../pages/AboutPage";
import ServicesPage from "../pages/ServicesPage";
import SolutionsPage from "../pages/SolutionsPage";
import VerifyPage from "../pages/verify/VerifyPage";
import PortalPage from "../pages/portal/PortalPage";
import CartPage from "../pages/cart/CartPage";
import CheckoutPage from "../pages/checkout/CheckoutPage";
import ProfilePage from "../pages/profile/ProfilePage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* STAFF PORTAL (Stock Management & Billing POS) */}
      <Route path="/portal" element={<PortalPage />} />

      {/* PUBLIC STOREFRONT (MAIN LAYOUT) */}
      <Route element={<MainLayout />}>
        {/* HOME */}
        <Route path="/" element={<Home />} />
        <Route path="/brands/:slug" element={<BrandPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        {/* PAGES */}
        <Route path="/products" element={<AllProductsPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<Contact />} />
        {/* E-COMMERCE CART, CHECKOUT & PROFILE */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* AUTHENTICITY CHECKER */}
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/verify/:imei" element={<VerifyPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
