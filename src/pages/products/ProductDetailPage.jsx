import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import ProductVariants from "../../components/products/ProductVariants";
import Container from "../../components/common/Container";
import ProductGallery from "../../components/products/ProductGallery";
import ProductInfo from "../../components/products/ProductInfo";
import ProductFeatures from "../../components/products/ProductFeatures";
import ProductSpecifications from "../../components/products/ProductSpecifications";
import InquiryCard from "../../components/products/InquiryCard";
import RelatedProducts from "../../components/products/RelatedProducts";

import { products } from "../../data/products/index";
import { brands } from "../../data/brandsData";
import { getDefaultVariant } from "../../utils/productVariant";

const ProductDetailPage = () => {
  const { slug } = useParams();

  const product = products.find((p) => p.slug === slug);

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
        <div className="py-20 text-center text-red-500">Product not found</div>
      </Container>
    );
  }

  const brand = brands.find((b) => b.slug === product.brand);

  return (
    <Container>
      {/* BREADCRUMB
      <div className="py-6 text-left pt-20 text-sm text-slate-500">
        Home / {brand?.name} / {product.name}
      </div> */}

      {/* MAIN PRODUCT SECTION */}
      <div className="grid lg:grid-cols-2 gap-12 py-10 pt-24 lg:pt-32 text-left">
        {/* LEFT: GALLERY */}

        <ProductGallery
          gallery={selectedVariant?.gallery || product.gallery}
          image={selectedVariant?.image || product.image}
          name={product.name}
        />

        {/* RIGHT: INFO + CTA (sticky on desktop) */}

        <ProductInfo
          product={product}
          selectedVariant={selectedVariant || getDefaultVariant(product)}
          onVariantChange={setSelectedVariant}
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-12 py-6 lg:py-10 text-left">
        <div className=" space-y-10">
          {/* FEATURES */}

          <ProductFeatures features={product.features} />

          {/* SPECIFICATIONS */}

          <ProductSpecifications specifications={product.specifications} />
        </div>
        <InquiryCard product={product} />
      </div>

      {/* RELATED PRODUCTS */}
      <div className="py-10">
        <RelatedProducts currentProduct={product} />
      </div>
    </Container>
  );
};

export default ProductDetailPage;
