const SpecificationRow = ({ label, value }) => {
  return (
    <div
      className="
        flex
        justify-between
        items-start
        px-3
        py-2
        border-b
        border-slate-200
      "
    >
      <span
        className="
          font-medium
          text-slate-600
        "
      >
        {label}
      </span>

      <span
        className="
          text-right
          font-semibold
          text-slate-900
        "
      >
        {value}
      </span>
    </div>
  );
};

export default SpecificationRow;
