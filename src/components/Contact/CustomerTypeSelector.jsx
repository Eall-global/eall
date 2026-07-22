const customerTypes = [
  "Retailer",
  "Distributor",
  "Corporate Buyer",
  "Individual Customer",
];

const CustomerTypeSelector = ({ value, onChange }) => {
  return (
    <div className=" mx-auto text-left w-full">
      <h4 className=" font-medium text-slate-800 mb-3">I am a</h4>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {customerTypes.map((item) => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`px-4 py-3 rounded-xl text-sm border transition


${
  value === item
    ? "bg-sky-700 text-white border-sky-700 shadow-md"
    : "bg-white border-slate-200 hover:border-sky-300"
}

`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomerTypeSelector;
