import Container from "../common/Container";
import ProductCard from "../products/ProductCard";

const FeaturedProducts = ({ products }) => {
  return (
    <section className="p-6 lg:p-10 bg-white">
      <div className="flex justify-between items-end mb-10">
        <div className=" text-left">
          <p className="text-sky-700 font-semibold uppercase text-sm">
            Featured Collection
          </p>

          <h2 className="text-lg lg:text-xl! font-bold text-slate-900! mt-2!">
            Top Products
          </h2>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
