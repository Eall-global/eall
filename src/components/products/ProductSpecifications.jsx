import SpecificationRow from "../common/SpecificationRow";

const ProductSpecifications = ({ specifications = {} }) => {
  return (
    <section>
      <h2 className=" text-xl! font-bold text-slate-900! mb-4! text-left">
        Product Specifications
      </h2>
      <div className=" border rounded-2xl  border-slate-300 overflow-hidden shadow-2xs">
        {Object.entries(specifications).map(([label, value]) => (
          <SpecificationRow key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
};

export default ProductSpecifications;
