import { FiCheckCircle } from "react-icons/fi";
import SectionCard from "../common/SectionCard";

const ProductFeatures = ({ features = [] }) => {
  if (!features.length) return null;

  return (
    <section>
      <h2 className=" text-xl! font-bold text-slate-900! mb-4! text-left">
        Key Features
      </h2>
      <div>
        {features.map((feature, index) => (
          <div key={index} className=" flex items-start py-2 gap-3">
            <FiCheckCircle
              className="
                text-green-600
                text-xl
                mt-0.5
                shrink-0
              "
            />

            <p className="text-slate-700 text-md leading-7">{feature}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductFeatures;
