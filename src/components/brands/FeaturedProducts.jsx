import Container from "../common/Container";
import ProductCard from "../products/ProductCard";

const FeaturedProducts = ({ products }) => {
  return (
    <section className="p-6 lg:p-10 bg-white">
      <div className="flex justify-between items-end mb-6">
        <div className=" text-left">
          <p className="text-sky-700 font-semibold uppercase text-sm">
            Featured Collection
          </p>

          <h2 className="text-lg lg:text-xl! font-bold text-slate-900! mt-2!">
            Top Products
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
