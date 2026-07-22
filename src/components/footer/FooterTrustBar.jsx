import { FiCheckCircle } from "react-icons/fi";

const items = [
  "100% Genuine Products",

  "Official Warranty",

  "Global Distribution",

  "Secure Business Transactions",
];

const FooterTrustBar = () => {
  return (
    <div className="border-y border-slate-800">
      <div
        className="
        py-5
        flex
        flex-wrap
        justify-center
        gap-8
      "
      >
        {items.map((item) => (
          <div
            key={item}
            className="
              flex
              items-center
              gap-2
              text-slate-300
            "
          >
            <FiCheckCircle className="text-sky-400" />

            <span className="text-sm">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FooterTrustBar;
