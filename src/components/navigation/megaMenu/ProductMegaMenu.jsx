import categories from "../../../data/categories";

import MegaMenuColumn from "./MegaMenuColumn";
import MegaMenuFooter from "./MegaMenuFooter";

const ProductMegaMenu = ({ onClose }) => {
  return (
    <div className="absolute top-full left-0 w-full bg-white shadow-2xl border-t border-slate-100 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 lg:py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-8 lg:gap-y-10 text-left">
          {categories.map((category) => (
            <MegaMenuColumn
              key={category.slug}
              category={category}
              onClose={onClose}
            />
          ))}
        </div>

        <MegaMenuFooter onClose={onClose} />
      </div>
    </div>
  );
};

export default ProductMegaMenu;
