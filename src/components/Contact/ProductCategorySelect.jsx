const ProductCategorySelect = ({ categories, value, onChange }) => {
  return (
    <div className=" mx-auto text-left w-full">
      <h4 className="font-medium text-slate-800 mb-3">Product Category</h4>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-2 bg-white"
      >
        <option value="">Select category</option>

        {categories.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
};

export default ProductCategorySelect;
