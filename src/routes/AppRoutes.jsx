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

// Placeholder pages (can be expanded later)
const Placeholder = ({ title }) => (
  <div className="p-20 text-center text-2xl font-bold">
    {title} Page Coming Soon
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* MAIN LAYOUT */}
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
      </Route>
    </Routes>
  );
};

export default AppRoutes;
