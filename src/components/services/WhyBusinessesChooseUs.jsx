import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import SlideUp from "../animations/SlideUp";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

import { FiAward, FiShield, FiGlobe, FiUsers } from "react-icons/fi";

const advantages = [
  {
    title: "15+ Years Industry Experience",
    description:
      "Backed by Fast Track Global General Trading LLC experience since 2008.",
    icon: <FiAward size={36} />,
  },

  {
    title: "100% Authentic Products",
    description:
      "Genuine electronics sourced through trusted global suppliers.",
    icon: <FiShield size={36} />,
  },

  {
    title: "50+ Global Brands",
    description: "Access to leading technology brands worldwide.",
    icon: <FiGlobe size={36} />,
  },

  {
    title: "Global Distribution Network",
    description:
      "Supporting partners across Africa, Middle East and international markets.",
    icon: <FiUsers size={36} />,
  },
];

const WhyBusinessesChooseUs = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-white">
      <SlideUp>
        <SectionTitle
          className=" text-left"
          label="OUR ADVANTAGE"
          title="Why Businesses Choose E-ALL"
          description="Combining industry experience, trusted partnerships, and reliable supply solutions to help businesses grow."
          center
          light
        />
      </SlideUp>

      <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
        {advantages.map((item) => (
          <StaggerItem
            key={item.title}
            className=" bg-white rounded-3xl p-10 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center "
          >
            <div>
              <div className="w-14 h-14 text-sky-700 rounded-2xl bg-linear-to-br from-[#0047D5]/10 to-[#FF5500]/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-500">
                {item.icon}
              </div>

              <h4 className="mt-4 text-sm lg:text-lg text-slate-900 font-bold ">
                {item.title}
              </h4>

              <p className="mt-4 text-slate-600 text-xs leading-7">
                {item.description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

export default WhyBusinessesChooseUs;
