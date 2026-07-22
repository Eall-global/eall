const quantities = [
  "Less than 100 Units",
  "100 - 500 Units",
  "500 - 1000 Units",
  "1000+ Units",
];

const QuantitySelector = ({ value, onChange }) => {
  return (
    <div className=" mx-auto text-left w-full">
      <h4 className="font-medium text-slate-800 mb-3">Expected Quantity</h4>

      <div className="flex flex-wrap gap-3">
        {quantities.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`px-4 py-2 rounded-full text-sm border

${value === item ? "bg-sky-700 text-white border-sky-700" : "bg-white"}

`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuantitySelector;
