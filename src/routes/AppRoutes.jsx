import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
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
import { useCountry } from "../context/CountryContext";

/**
 * Redirects root "/" and legacy unprefixed storefront links ("/products", "/brands/apple", etc.)
 * to the active/geolocated country prefix (e.g., "/ae/products", "/ke/brands/apple").
 */
const CountryRedirect = () => {
  const { preferredCountrySlug } = useCountry();
  const location = useLocation();
  const targetSlug = preferredCountrySlug || "ae";
  const path = location.pathname === "/" ? "" : location.pathname;
  return (
    <Navigate
      to={`/${targetSlug}${path}${location.search || ""}${location.hash || ""}`}
      replace
    />
  );
};

/**
 * Validates /:countryCode against active public country storefronts.
 */
const CountryRouteGuard = () => {
  const { countryCode } = useParams();
  const { validPublicSlugs, preferredCountrySlug } = useCountry();
  const slug = String(countryCode || "").toLowerCase();

  if (!validPublicSlugs.includes(slug)) {
    return <Navigate to={`/${preferredCountrySlug || "ae"}`} replace />;
  }
  return <MainLayout />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* STAFF BACK-OFFICE PORTAL (HQ & Country-Scoped) */}
      <Route path="/portal" element={<PortalPage />} />
      <Route path="/:countryCode/portal" element={<PortalPage />} />

      {/* ROOT & LEGACY UNPREFIXED STOREFRONT REDIRECTS -> /:countryCode/... */}
      <Route path="/" element={<CountryRedirect />} />
      <Route path="/products" element={<CountryRedirect />} />
      <Route path="/products/:slug" element={<CountryRedirect />} />
      <Route path="/brands" element={<CountryRedirect />} />
      <Route path="/brands/:slug" element={<CountryRedirect />} />
      <Route path="/solutions" element={<CountryRedirect />} />
      <Route path="/services" element={<CountryRedirect />} />
      <Route path="/about" element={<CountryRedirect />} />
      <Route path="/contact" element={<CountryRedirect />} />
      <Route path="/cart" element={<CountryRedirect />} />
      <Route path="/checkout" element={<CountryRedirect />} />
      <Route path="/profile" element={<CountryRedirect />} />
      <Route path="/verify" element={<CountryRedirect />} />
      <Route path="/verify/:imei" element={<CountryRedirect />} />

      {/* MULTI-COUNTRY PUBLIC STOREFRONT (e.g. /ae, /ke, /sn, /ug, /ci, /gh, /sa) */}
      <Route path="/:countryCode" element={<CountryRouteGuard />}>
        <Route index element={<Home />} />
        <Route path="brands/:slug" element={<BrandPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="products" element={<AllProductsPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="solutions" element={<SolutionsPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<Contact />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="verify/:imei" element={<VerifyPage />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<CountryRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
