import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

const ProductSubCategories = ({ subCategories = [], selected, onChange }) => {
  if (!subCategories.length) return null;

  return (
    <section className="bg-white px-6 lg:px-10 py-6">
      <StaggerContainer className="flex flex-wrap gap-3">
        <StaggerItem key="all">
          <button
            onClick={() => onChange("All")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition
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
            className={`rounded-full px-5 py-2 text-sm font-medium transition
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
