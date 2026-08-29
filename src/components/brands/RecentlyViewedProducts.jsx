import ProductCard from "../products/ProductCard";
import Container from "../common/Container";

const RecentlyViewedProducts = ({ products }) => {
  if (!products.length) return null;

  return (
    <section className="py-16">
      <Container>
        <h2 className="text-lg sm:text-xl font-bold mb-8">Recently Viewed</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default RecentlyViewedProducts;
