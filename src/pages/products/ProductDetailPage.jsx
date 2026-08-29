import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";

import Container from "../../components/common/Container";
import ProductGallery from "../../components/products/ProductGallery";
import ProductInfo from "../../components/products/ProductInfo";
import ProductFeatures from "../../components/products/ProductFeatures";
import ProductSpecifications from "../../components/products/ProductSpecifications";
import RelatedProducts from "../../components/products/RelatedProducts";
import ProductSEO from "../../components/products/ProductSEO";

import { products as fallbackProducts } from "../../data/products/index";
import { brands } from "../../data/brandsData";
import { getDefaultVariant } from "../../utils/productVariant";
import { useCatalog } from "../../context/CatalogContext";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { getProductBySlug, products } = useCatalog();

  const product = getProductBySlug(slug) || (products || fallbackProducts).find((p) => p.slug === slug);

  const [selectedVariant, setSelectedVariant] = useState(
    getDefaultVariant(product),
  );

  useEffect(() => {
    if (product) {
      setSelectedVariant(getDefaultVariant(product));
    }
  }, [slug, product]);

  if (!product) {
    return (
      <Container>
        <div className="py-32 text-center text-rose-500 font-bold">Product not found</div>
      </Container>
    );
  }

  const brand = brands.find((b) => b.slug === product.brand);

  return (
    <Container>
      {/* 🚀 GOOGLE SEO & PRODUCT SCHEMA.ORG RICH SNIPPETS */}
      <ProductSEO product={product} />

      <div className="pt-24 sm:pt-28 lg:pt-32 pb-16 space-y-6">

        {/* 🧭 TOP BREADCRUMB & BACK NAVIGATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3 text-left">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 transition shrink-0"
          >
            <FiArrowLeft className="text-sm" />
            <span>Back to Products</span>
          </Link>

          {/* Breadcrumbs Trail (Visible on desktop only to keep mobile clean and non-redundant) */}
          <nav className="hidden sm:flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-slate-900 transition">Home</Link>
            <FiChevronRight className="text-slate-300 shrink-0" />
            <Link to="/products" className="hover:text-slate-900 transition">Products</Link>
            {brand && (
              <>
                <FiChevronRight className="text-slate-300 shrink-0" />
                <Link to={`/brands/${brand.slug}`} className="hover:text-slate-900 transition font-semibold text-slate-700">
                  {brand.name}
                </Link>
              </>
            )}
            <FiChevronRight className="text-slate-300 shrink-0" />
            <span className="font-bold text-slate-900 truncate max-w-45 sm:max-w-xs">{product.name}</span>
          </nav>
        </div>

        {/* MAIN PRODUCT SECTION (Gallery + Info & Add to Cart) */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 text-left items-start">
          {/* LEFT: GALLERY */}
          <ProductGallery
            gallery={selectedVariant?.gallery || product.gallery}
            image={selectedVariant?.image || product.image}
            name={product.name}
          />

          {/* RIGHT: INFO + PRICING + CART CTA */}
          <ProductInfo
            product={product}
            selectedVariant={selectedVariant || getDefaultVariant(product)}
            onVariantChange={setSelectedVariant}
          />
        </div>

        {/* FULL-WIDTH FEATURES & SPECIFICATIONS OVERVIEW */}
        <div className="py-6 sm:py-10 space-y-10 text-left border-t border-slate-200/80 mt-4">
          {/* KEY HIGHLIGHTS CARDS */}
          <ProductFeatures features={product.features} />

          {/* COMPREHENSIVE TECHNICAL SPECIFICATIONS MATRIX & TRUST BADGES */}
          <ProductSpecifications specifications={product.specifications} product={product} />
        </div>

        {/* RELATED PRODUCTS */}
        <div className="py-6 sm:py-10 border-t border-slate-200/80">
          <RelatedProducts currentProduct={product} />
        </div>

      </div>
    </Container>
  );
};

export default ProductDetailPage;
