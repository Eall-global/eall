import {
  FiShield,
  FiGlobe,
  FiTruck,
  FiPackage,
  FiUsers,
  FiHeadphones,
} from "react-icons/fi";

import SectionTitle from "../common/SectionTitle";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";
import SlideUp from "../animations/SlideUp";

const benefits = [
  {
    icon: FiShield,
    title: "Genuine Products",
    description:
      "We supply authentic products from globally recognized technology manufacturers.",
  },

  {
    icon: FiGlobe,
    title: "Global Brand Network",
    description:
      "Access leading brands from different regions through our established partnerships.",
  },

  {
    icon: FiPackage,
    title: "Wholesale Supply",
    description:
      "Flexible solutions for retailers, distributors and bulk buyers.",
  },

  {
    icon: FiTruck,
    title: "Reliable Logistics",
    description:
      "Efficient supply chain solutions supporting regional and international deliveries.",
  },

  {
    icon: FiUsers,
    title: "Business Focused",
    description:
      "Solutions designed specifically for retail, wholesale and enterprise customers.",
  },

  {
    icon: FiHeadphones,
    title: "Dedicated Support",
    description:
      "Our team assists with sourcing, availability and product requirements.",
  },
];

const WhyChooseBrands = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <SlideUp>
        <SectionTitle
          className=" text-left"
          label="WHY E-ALL"
          title="Why Businesses Choose Our Brand Network"
          description="
We connect businesses with trusted technology brands through reliable sourcing and distribution solutions.
"
        />

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {benefits.map((item) => (
            <StaggerItem
              key={item.title}
              className=" bg-white border border-slate-200 hover:border-sky-600 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative group h-full"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0047D5]/10 flex items-center justify-center text-sky-700 text-xl font-bold transition group-hover:scale-110 ">
                <item.icon />
              </div>

              <h3 className="mt-6 text-lg font-semibold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-3 text-slate-600 leading-relaxed text-xs">
                {item.description}
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </SlideUp>
    </section>
  );
};

export default WhyChooseBrands;
