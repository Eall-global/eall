import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

const ProductSubCategories = ({ subCategories = [], selected, onChange }) => {
  if (!subCategories.length) return null;

  return (
    <section className="bg-white py-2 px-6 lg:px-10 lg:py-4">
      <StaggerContainer className="flex lg:flex-wrap gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <StaggerItem key="all">
          <button
            onClick={() => onChange("All")}
            className={`shrink-0 rounded-full px-5 py-2 text-xs lg:text-sm font-medium transition
              ${
                selected === "All"
                  ? "bg-sky-100 border-2 border-sky-700"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
          >
            All
          </button>
        </StaggerItem>

        {subCategories.map((item) => (
          <button
            key={item.slug}
            onClick={() => onChange(item.slug)}
            className={`shrink-0 rounded-full px-5 py-2 text-xs lg:text-sm font-medium transition
                ${
                  selected === item.slug
                    ? "bg-sky-100 border-2 border-sky-700"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
          >
            {item.name}
          </button>
        ))}
      </StaggerContainer>
    </section>
  );
};

export default ProductSubCategories;
