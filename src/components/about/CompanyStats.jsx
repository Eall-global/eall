import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import { companyStats } from "./aboutData";

import { FiGlobe, FiAward, FiTrendingUp, FiShield } from "react-icons/fi";

const icons = [
  <FiAward size={36} />,
  <FiShield size={36} />,
  <FiGlobe size={36} />,
  <FiTrendingUp size={36} />,
];

const CompanyStats = () => {
  return (
    <section className=" px-6 lg:px-10 py-10 lg:py-16 bg-gray-100">
      <SectionTitle
        className=" flexx flex-col text-left"
        label="COMPANY AT A GLANCE"
        title="Our Journey in Numbers"
        description="Every milestone reflects our commitment to delivering authentic
            products, exceptional service, and sustainable partnerships across
            global markets."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
        {companyStats.map((item, index) => (
          <div
            key={item.label}
            className="
                bg-white
                rounded-3xl
                p-10
                shadow-sm
                hover:shadow-xl
                hover:-translate-y-2
                transition-all
                duration-300
                text-center "
          >
            <div className="w-14 h-14 text-sky-700 rounded-2xl bg-linear-to-br from-[#0047D5]/10 to-[#FF5500]/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-500">
              {icons[index]}
            </div>

            <p className="mt-4 font-bold text-slate-900 leading-7">
              {item.label}
            </p>
            <p className="mt-4 text-slate-600 text-xs leading-7">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CompanyStats;
