import Container from "../common/Container";
import ProductCard from "../products/ProductCard";

const NewArrivals = ({ products }) => {
  return (
    <section className="p-6 lg:p-10 bg-white">
      <h2 className="text-3xl text-slate-900! text-left font-bold mb-8!">
        New Arrivals
      </h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default NewArrivals;
