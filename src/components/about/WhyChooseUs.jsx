import Container from "../common/Container";

import {
  FiShield,
  FiGlobe,
  FiDollarSign,
  FiTruck,
  FiUsers,
  FiHeadphones,
} from "react-icons/fi";

import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";
import SlideUp from "../animations/SlideUp";
import SectionTitle from "../common/SectionTitle";

const reasons = [
  {
    icon: <FiShield />,
    title: "100% Genuine Products",
    description:
      "We supply authentic smartphones, accessories, and electronics sourced through trusted global channels.",
  },

  {
    icon: <FiGlobe />,
    title: "Global Sourcing Network",
    description:
      "Strong international supplier relationships allow us to provide competitive and reliable product availability.",
  },

  {
    icon: <FiDollarSign />,
    title: "Competitive Pricing",
    description:
      "Optimized sourcing and distribution enable attractive pricing for wholesale and retail partners.",
  },

  {
    icon: <FiTruck />,
    title: "Reliable Supply Chain",
    description:
      "Efficient logistics solutions ensure smooth movement of products across international markets.",
  },

  {
    icon: <FiUsers />,
    title: "Dealer Partnership",
    description:
      "We support long-term relationships with retailers and distributors through dedicated service.",
  },

  {
    icon: <FiHeadphones />,
    title: "Professional Support",
    description:
      "Our team provides responsive assistance throughout sourcing, ordering, and delivery.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className=" px-6 lg:px-10 py-10 lg:py-16 bg-white">
      <SlideUp>
        <SectionTitle
          className=" flexx flex-col text-left"
          label="WHY E-ALL"
          title="  Your Trusted Technology Partner"
          description="  Combining industry experience, global sourcing, and reliable
              service to help businesses grow."
        />
      </SlideUp>

      <StaggerContainer className=" grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16 ">
        {reasons.map((item) => (
          <StaggerItem key={item.title}>
            <div className=" group p-8 rounded-3xl border border-slate-200 hover:border-sky-600 hover:shadow-xl transition-all duration-300 ">
              <div className=" w-14 h-14 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 text-2xl group-hover:bg-sky-700 group-hover:text-white transition">
                {item.icon}
              </div>

              <h3 className=" mt-6 text-xl font-bold text-slate-900 ">
                {item.title}
              </h3>

              <p className=" mt-4 text-slate-600 leading-7 ">
                {item.description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

export default WhyChooseUs;
