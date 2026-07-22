import SpecificationRow from "../common/SpecificationRow";

const ProductSpecifications = ({ specifications = {} }) => {
  return (
    <section>
      <h2 className=" text-xl! font-bold text-slate-900! mb-4! text-left">
        Product Specifications
      </h2>
      {Object.entries(specifications).map(([label, value]) => (
        <SpecificationRow key={label} label={label} value={value} />
      ))}
    </section>
  );
};

export default ProductSpecifications;
