import { FiCheckCircle } from "react-icons/fi";

const items = [
  "100% Genuine Products",
  "Official Warranty",
  "Global Distribution",
  "Secure Transactions",
];

const FooterTrustBar = () => {
  return (
    <div className="border-y border-slate-800/80 bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center justify-center sm:justify-start gap-2 text-slate-300 text-xs sm:text-sm font-medium"
          >
            <FiCheckCircle className="text-sky-400 shrink-0 text-sm sm:text-base" />
            <span className="truncate">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FooterTrustBar;
