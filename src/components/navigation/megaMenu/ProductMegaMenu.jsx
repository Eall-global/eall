import categories from "../../../data/categories";

import MegaMenuColumn from "./MegaMenuColumn";
import MegaMenuFooter from "./MegaMenuFooter";

const ProductMegaMenu = ({ onClose }) => {
  return (
    <div className="fixed top-22 left-0 w-full bg-white z-50">
      <div className=" max-w-7xl mx-auto px-10 py-10">
        <div className=" grid grid-cols-3 gap-x-12 gap-y-10 text-left ">
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
