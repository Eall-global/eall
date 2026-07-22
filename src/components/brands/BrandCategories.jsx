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
    <section className=" py-4 bg-white">
      <Container>
        <div className="flex flex-wrap gap-3">
          {allCategories.map((category) => (
            <button
              key={category.slug}
              onClick={() => onSelect(category.slug)}
              className={`
                px-5
                py-2.5
                rounded-full
                text-sm
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
        </div>
      </Container>
    </section>
  );
};

export default BrandCategories;
