import { Link } from "react-router-dom";

const MobileSubCategoryAccordion = ({ category, onClose }) => {
  return (
    <div
      className="
        ml-4
        mt-1
        border-l
        border-slate-100
        pl-4
        space-y-1
      "
    >
      {category.subCategories.map((subCategory) => (
        <Link
          key={subCategory.slug}
          to={`/products?category=${category.slug}&subcategory=${subCategory.slug}`}
          onClick={onClose}
          className="
            block
            rounded-lg
            px-3
            py-2
            text-sm
            text-slate-500
            hover:text-sky-700
            hover:bg-sky-50
            transition
          "
        >
          {subCategory.name}
        </Link>
      ))}
    </div>
  );
};

export default MobileSubCategoryAccordion;
