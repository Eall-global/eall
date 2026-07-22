import ProductCard from "../products/ProductCard";

const BrandProducts = ({ products }) => {
  return (
    <section id="products" className=" p-6 lg:p-10 bg-white">
      <div
        className="
            grid
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
            gap-8
          "
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default BrandProducts;
