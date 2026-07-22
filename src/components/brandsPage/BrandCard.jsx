import { Link } from "react-router-dom";
import { FiArrowRight, FiMapPin, FiPackage } from "react-icons/fi";

const BrandCard = ({ brand }) => {
  return (
    <article
      className="
group
bg-white
rounded-3xl
border
border-slate-200
p-6
hover:border-sky-500
hover:shadow-xl
transition-all
duration-300
"
    >
      {/* LOGO */}

      <div
        className="
h-24
flex
items-center
justify-center
bg-slate-50
rounded-2xl
"
      >
        <img
          src={brand.logo}
          alt={brand.name}
          className="
max-h-16
object-contain
group-hover:scale-110
transition
"
        />
      </div>

      <h3
        className="
mt-6
text-xl
font-bold
text-slate-900
"
      >
        {brand.name}
      </h3>

      <div
        className="
mt-3
flex
items-center
gap-2
text-sm
text-slate-500
"
      >
        <FiMapPin />

        {brand.country}
      </div>

      <p
        className="
mt-3!
text-sm
text-slate-600
leading-6
line-clamp-3
text-left
"
      >
        {brand.description}
      </p>

      {/* CATEGORIES */}

      <div
        className="
mt-5
flex
flex-wrap
gap-2
"
      >
        {brand.categories?.slice(0, 3).map((category) => (
          <span
            key={category.slug}
            className="
text-xs
px-3
py-1
rounded-full
bg-sky-50
text-sky-700
"
          >
            {category.name}
          </span>
        ))}
      </div>

      <div
        className="
mt-6
flex
justify-between
items-center
"
      >
        <div
          className="
flex
items-center
gap-2
text-sm
text-slate-600
"
        >
          <FiPackage />
          {brand.stats?.products || 0} Products
        </div>

        <Link
          to={`/brands/${brand.slug}`}
          className="
flex
items-center
gap-2
text-sky-700
font-medium
"
        >
          Explore
          <FiArrowRight
            className="
group-hover:translate-x-1
transition
"
          />
        </Link>
      </div>
    </article>
  );
};

export default BrandCard;
