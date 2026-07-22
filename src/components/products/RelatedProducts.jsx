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
    <SectionCard title="Related Products">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </SectionCard>
  );
};

export default RelatedProducts;
