import { Link } from "react-router-dom";

import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import ProductCard from "../products/ProductCard";

import { products } from "../../data/products/index";

const shuffleArray = (array) => {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

const FeaturedProducts = () => {
  // You can later replace this with API-driven "featured" flag
  const featuredProducts = shuffleArray(
    products.filter((p) => p.isFeatured).slice(0, 8),
  );

  return (
    <section>
      <Container className="py-20">
        {/* Header */}

        <SectionTitle
          className="flex flex-col text-left"
          label="Featured"
          title="Top Selling Products"
          description="Explore high-demand electronics trusted by global retailers and distributors."
        />

        <Link
          to="/products"
          className="
              text-sm
              font-semibold
              text-sky-700
              hover:text-sky-900
              transition
              flex
              whitespace-nowrap
            "
        >
          View All Products →
        </Link>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8 mt-10">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center text-slate-500 py-16">
              No featured products available.
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};

export default FeaturedProducts;
