import { Link } from "react-router-dom";

const SubCategoryPills = ({
  category,
  categories,
  selectedSubCategory = "All",
}) => {
  const activeCategory = categories.find((item) => item.slug === category);

  if (!activeCategory?.subCategories?.length) {
    return null;
  }

  return (
    <section className="px-6 lg:px-10 py-6 bg-white">
      <div className="flex flex-wrap gap-3">
        {/* ALL OPTION */}
        <Link
          to={`/products?category=${category}`}
          className={`
            px-5
            py-2.5
            rounded-full
            text-sm
            font-medium
            transition
            ${
              selectedSubCategory === "All"
                ? "bg-sky-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-sky-50"
            }
          `}
        >
          All
        </Link>

        {activeCategory.subCategories.map((sub) => (
          <Link
            key={sub.slug}
            to={`/products?category=${category}&subcategory=${sub.slug}`}
            className={`
              px-5
              py-2.5
              rounded-full
              text-sm
              font-medium
              transition
              ${
                selectedSubCategory === sub.slug
                  ? "bg-sky-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-sky-50"
              }
            `}
          >
            {sub.name}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SubCategoryPills;
