import { Link } from "react-router-dom";

const MegaMenuColumn = ({ category, onClose }) => {
  const Icon = category.icon;

  return (
    <div>
      {/* Category Header */}

      <div className="flex items-center gap-3 mb-5">
        <Icon className="text-sky-700 text-xl" />

        <h3 className="font-semibold text-slate-900">{category.name}</h3>
      </div>

      <ul className="space-y-4">
        {category.subCategories.map((subCategory) => (
          <li key={subCategory.slug}>
            {/* Sub Category */}

            <Link
              to={`/products?category=${category.slug}&subcategory=${subCategory.slug}`}
              onClick={onClose}
              className="
                block
                text-sm
                font-medium
                text-slate-700
                hover:text-sky-700
                transition
              "
            >
              {subCategory.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MegaMenuColumn;
