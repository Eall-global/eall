import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  FiArrowLeft,
  FiChevronRight,
  FiShoppingCart,
  FiZap,
  FiCheck,
} from "react-icons/fi";

import Container from "../../components/common/Container";
import ProductGallery from "../../components/products/ProductGallery";
import ProductInfo from "../../components/products/ProductInfo";
import ProductFeatures from "../../components/products/ProductFeatures";
import ProductSpecifications from "../../components/products/ProductSpecifications";
import RelatedProducts from "../../components/products/RelatedProducts";
import ProductSEO from "../../components/products/ProductSEO";
import QuickRfqModal from "../../components/home/QuickRfqModal";
import { AedPrice } from "../../components/common/AedSymbol";

import { products as fallbackProducts } from "../../data/products/index";
import { brands } from "../../data/brandsData";
import {
  getDefaultVariant,
  getDefaultStorage,
  getActiveVariant,
} from "../../utils/productVariant";
import {
  useCatalog,
  estimateCatalogRetailPrice,
} from "../../context/CatalogContext";
import { useCart } from "../../context/CartContext";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { getProductBySlug, products } = useCatalog();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [stickyAdded, setStickyAdded] = useState(false);

  const product =
    getProductBySlug(slug) ||
    (products || fallbackProducts).find((p) => p.slug === slug);

  // Two independent axes: colour variant + storage (scoped to active slug)
  const [selection, setSelection] = useState({
    slug: null,
    colorVariant: null,
    storage: null,
  });
  const [rfqTarget, setRfqTarget] = useState({ open: false, product: "" });

  const selectedColorVariant =
    selection.slug === slug && selection.colorVariant
      ? selection.colorVariant
      : getDefaultVariant(product);

  const selectedStorage =
    selection.slug === slug && selection.storage
      ? selection.storage
      : getDefaultStorage(product);

  const handleVariantChange = (nextVariant) => {
    setSelection((prev) => ({
      slug,
      colorVariant: nextVariant,
      storage:
        prev.slug === slug && prev.storage
          ? prev.storage
          : getDefaultStorage(product),
    }));
  };

  const handleStorageChange = (nextStorage) => {
    setSelection((prev) => ({
      slug,
      colorVariant:
        prev.slug === slug && prev.colorVariant
          ? prev.colorVariant
          : getDefaultVariant(product),
      storage: nextStorage,
    }));
  };

  // Derive the active merged variant (image + sku + live price + availability)
  const activeVariant = useMemo(
    () => getActiveVariant(product, selectedColorVariant, selectedStorage),
    [product, selectedColorVariant, selectedStorage]
  );

  if (!product) {
    return (
      <Container>
        <div className="py-36 text-center text-rose-500 font-bold">
          Product not found
        </div>
      </Container>
    );
  }

  const brand = brands.find(
    (b) =>
      b.slug === (product.brandSlug || (product.brand || "").toLowerCase())
  );

  const stickyPrice =
    Number(activeVariant?.livePrice) > 0
      ? Number(activeVariant.livePrice)
      : Number(activeVariant?.price) > 0
      ? Number(activeVariant.price)
      : Number(product.livePrice) > 0
      ? Number(product.livePrice)
      : Number(product.price) > 0
      ? Number(product.price)
      : estimateCatalogRetailPrice(product);

  const handleStickyAdd = () => {
    addToCart(product, 1, {
      color: activeVariant?.color || "",
      storage: activeVariant?.storage || selectedStorage || "",
      sku: activeVariant?.sku || product.sku,
      price: stickyPrice,
      openDrawer: true,
    });
    setStickyAdded(true);
    window.setTimeout(() => setStickyAdded(false), 2000);
  };

  const handleStickyBuyNow = () => {
    addToCart(product, 1, {
      color: activeVariant?.color || "",
      storage: activeVariant?.storage || selectedStorage || "",
      sku: activeVariant?.sku || product.sku,
      price: stickyPrice,
      openDrawer: false,
    });
    navigate("/checkout");
  };

  return (
    <Container>
      {/* GOOGLE SEO & PRODUCT SCHEMA.ORG RICH SNIPPETS */}
      <ProductSEO product={product} />

      <div className="pt-[108px] sm:pt-[116px] xl:pt-[148px] pb-16 space-y-6">
        {/* TOP BREADCRUMB & BACK NAVIGATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3 text-left">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 transition shrink-0"
          >
            <FiArrowLeft className="text-sm" />
            <span>Back to Catalog</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-slate-900 transition">
              Home
            </Link>
            <FiChevronRight className="text-slate-300 shrink-0" />
            <Link to="/products" className="hover:text-slate-900 transition">
              Products
            </Link>
            {brand && (
              <>
                <FiChevronRight className="text-slate-300 shrink-0" />
                <Link
                  to={`/brands/${brand.slug}`}
                  className="hover:text-slate-900 transition font-semibold text-slate-700"
                >
                  {brand.name}
                </Link>
              </>
            )}
            <FiChevronRight className="text-slate-300 shrink-0" />
            <span className="font-bold text-slate-900 truncate max-w-45 sm:max-w-xs">
              {product.name}
            </span>
          </nav>
        </div>

        {/* MAIN PRODUCT SECTION (Gallery + Info & Buy Box) */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 text-left items-start">
          {/* LEFT: GALLERY (6 cols on lg, 5 cols on xl) */}
          <div className="lg:col-span-6 xl:col-span-6">
            <ProductGallery
              gallery={activeVariant?.gallery || product.gallery}
              image={activeVariant?.image || product.image}
              name={product.name}
            />
          </div>

          {/* RIGHT: INFO + PRICING + RETAIL & B2B CTA (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6">
            <ProductInfo
              product={product}
              selectedVariant={activeVariant}
              selectedStorage={selectedStorage}
              onVariantChange={handleVariantChange}
              onStorageChange={handleStorageChange}
              onOpenRfq={(label) =>
                setRfqTarget({ open: true, product: label })
              }
            />
          </div>
        </div>

        {/* FULL-WIDTH FEATURES & SPECIFICATIONS OVERVIEW */}
        <div className="py-6 sm:py-10 space-y-10 text-left border-t border-slate-200/80 mt-4">
          <ProductSpecifications
            specifications={product.specifications}
            product={product}
          />
          <ProductFeatures features={product.features} />
        </div>

        {/* RELATED PRODUCTS */}
        <div className="py-6 sm:py-10 border-t border-slate-200/80">
          <RelatedProducts currentProduct={product} />
        </div>
      </div>

      {/* STICKY MOBILE / TABLET BUY BAR (Shown below lg breakpoint) */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3.5 py-2.5 shadow-lg flex items-center justify-between gap-2.5 text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={activeVariant?.image || product.image || "/logo.png"}
            alt={product.name}
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 p-1 object-contain shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {product.shortName || product.name}
            </p>
            <div className="flex items-center gap-1.5">
              <AedPrice
                amount={stickyPrice}
                className="text-xs font-black font-mono text-sky-900"
                symbolClassName="text-sky-700"
              />
              {(activeVariant?.color || selectedStorage) && (
                <span className="text-[10px] text-slate-500 truncate">
                  • {[activeVariant?.color, selectedStorage].filter(Boolean).join(" / ")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleStickyAdd}
            className={`px-3 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1 transition cursor-pointer ${
              stickyAdded
                ? "bg-emerald-600 text-white"
                : "bg-sky-700 hover:bg-sky-800 text-white"
            }`}
          >
            {stickyAdded ? (
              <>
                <FiCheck className="text-xs" />
                <span>Added</span>
              </>
            ) : (
              <>
                <FiShoppingCart className="text-xs" />
                <span>Add</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleStickyBuyNow}
            className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold inline-flex items-center gap-1 transition cursor-pointer"
          >
            <FiZap className="text-amber-400 text-xs" />
            <span>Buy</span>
          </button>
        </div>
      </div>

      <QuickRfqModal
        isOpen={rfqTarget.open}
        initialProduct={rfqTarget.product}
        onClose={() => setRfqTarget({ open: false, product: "" })}
      />
    </Container>
  );
};

export default ProductDetailPage;
