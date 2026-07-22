import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

const ProductCategoryKPIs = ({
  categories,
  selectedCategory,
  onCategoryChange,
  products,
}) => {
  return (
    <section className=" p-6 lg:p-10 bg-white">
      <StaggerContainer className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon;

          const total = products.filter(
            (product) => product.category === category.slug,
          ).length;

          return (
            <StaggerItem key={category.slug}>
              <button
                onClick={() => onCategoryChange(category.slug)}
                className={`
                  w-full
                  h-full
                  rounded-2xl
                  border
                  p-6
                  text-left
                  transition-all
                  ${
                    selectedCategory === category.slug
                      ? "border-sky-700 bg-sky-700 text-white shadow-xl"
                      : "border-slate-200 bg-white hover:border-sky-300 hover:shadow-lg"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <Icon className="text-3xl" />

                  <span className="text-2xl font-bold">{total}</span>
                </div>

                <h3 className="mt-6 text-xl font-semibold">{category.name}</h3>

                <p className="mt-2 text-sm opacity-80 leading-6">
                  {category.description}
                </p>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </section>
  );
};

export default ProductCategoryKPIs;
