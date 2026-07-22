import Container from "../common/Container";
import { FiPackage, FiShield, FiGlobe, FiCalendar } from "react-icons/fi";

const BrandStatistics = ({ brand }) => {
  const stats = [
    {
      icon: <FiPackage />,
      label: "Products",
      value: brand.stats.products,
    },
    {
      icon: <FiShield />,
      label: "Warranty",
      value: brand.stats.warranty,
    },
    {
      icon: <FiGlobe />,
      label: "Country",
      value: brand.country,
    },
    {
      icon: <FiCalendar />,
      label: "Founded",
      value: brand.founded,
    },
  ];

  return (
    <section className=" bg-white">
      <div className="grid grid-cols-2 lg:grid-cols-4 ">
        {stats.map((item) => (
          <div
            key={item.label}
            className=" flex mx-auto gap-4 text-left items-center "
          >
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#0047D5]/10 to-[#FF5500]/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
              <span className=" text-xl text-sky-700"> {item.icon}</span>
            </div>

            <p className="text-lg font-bold text-slate-900">
              {item.value} {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BrandStatistics;
