import ProductCard from "../products/ProductCard";

const BrandProducts = ({ products, total }) => {
  return (
    <section id="products" className=" p-6 lg:p-10 bg-white">
      <p className="text-slate-500 text-xs lg:text-sm pb-4">
        Showing {total} products
      </p>
      <div className=" grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default BrandProducts;
