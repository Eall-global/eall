import { Link } from "react-router-dom";
import Container from "../common/Container";

const RelatedBrands = ({ brands, current }) => {
  const related = brands
    .filter((item) => item.slug !== current.slug)
    .slice(0, 6);

  return (
    <section className="p-6 lg:p-10 bg-white">
      <h2 className="text-lg sm:text-xl text-slate-900 font-bold mb-8">
        Related Brands
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {related.map((brand) => (
          <Link
            key={brand.slug}
            to={`/brands/${brand.slug}`}
            className="bg-white rounded-2xl p-6 flex items-center justify-center hover:shadow-lg transition"
          >
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-12 object-contain"
            />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedBrands;
