import StaggerContainer from "../animations/StaggerContainer";
import Container from "../common/Container";

const BrandCategories = ({ categories, selectedCategory, onSelect }) => {
  const allCategories = [
    {
      name: "All",
      slug: "All",
    },
    ...categories,
  ];

  return (
    <section className="py-2 px-6 lg:px-10 lg:py-4">
      <div className=" overflow-x-auto whitespace-nowrap scrollbar-hide">
        <StaggerContainer className="flex lg:flex-wrap gap-3 w-max lg:w-auto">
          {allCategories.map((category) => (
            <button
              key={category.slug}
              onClick={() => onSelect(category.slug)}
              className={`
                px-5
                py-2
                rounded-full
                lg:text-sm text-xs
                font-medium
                transition

                ${
                  selectedCategory === category.slug
                    ? "bg-sky-700 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                }
              `}
            >
              {category.name}
            </button>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default BrandCategories;
