import SectionCard from "../common/SectionCard";
import ProductCard from "./ProductCard";
import { products } from "../../data/products/index";

const RelatedProducts = ({ currentProduct }) => {
  if (!currentProduct) return null;

  const related = products
    .filter((p) => p.slug !== currentProduct.slug)
    .filter(
      (p) =>
        p.brand === currentProduct.brand ||
        p.category === currentProduct.category,
    )
    .slice(0, 6);

  if (!related.length) return null;

  return (
    <section className=" bg-white">
      <h2 className="text-3xl text-slate-900! text-left font-bold mb-6!">
        Related Products
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-8">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
