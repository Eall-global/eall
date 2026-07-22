import { FiCheckCircle } from "react-icons/fi";
import { company } from "./footerData";

const FooterCompany = () => {
  return (
    <div>
      <img
        src="/logo.png"
        alt={company.shortName}
        className="lg:h-16 h-12 w-auto mb-5"
      />

      <h3 className="text-xl font-semibold text-left text-white">
        {company.tagline}
      </h3>

      <p className="mt-5 text-slate-400 leading-7 text-justify">
        {company.description}
      </p>
    </div>
  );
};

export default FooterCompany;
