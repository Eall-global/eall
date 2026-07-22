import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import SlideUp from "../animations/SlideUp";

import { FiLayers, FiGlobe, FiBarChart, FiTruck } from "react-icons/fi";

const benefits = [
  {
    icon: <FiLayers />,
    title: "Bulk Supply",
    text: "Large quantity procurement with flexible ordering.",
  },

  {
    icon: <FiGlobe />,
    title: "Global Sourcing",
    text: "Access products through international supplier networks.",
  },

  {
    icon: <FiBarChart />,
    title: "Better Margins",
    text: "Competitive pricing supporting distributor growth.",
  },

  {
    icon: <FiTruck />,
    title: "Export Support",
    text: "Complete coordination from warehouse to destination.",
  },
];

const WholesaleSolution = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <SlideUp>
        <SectionTitle
          className=" flex flex-col text-center items-center"
          label="WHOLESALE SOLUTIONS"
          title="Powering Distribution Networks Worldwide"
          description="Supporting wholesalers and distributors with scalable sourcing, inventory solutions and international supply capabilities."
        />
      </SlideUp>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
        {benefits.map((item) => (
          <div key={item.title} className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="text-3xl text-sky-700">{item.icon}</div>

            <h3 className="mt-5 font-bold text-xl">{item.title}</h3>

            <p className="mt-3 text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WholesaleSolution;
