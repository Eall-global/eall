import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import SlideUp from "../animations/SlideUp";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

import {
  FiPackage,
  FiDollarSign,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";

const features = [
  {
    icon: <FiPackage />,
    title: "Wide Product Selection",
    description:
      "Access smartphones, accessories, and consumer electronics from leading global brands.",
  },

  {
    icon: <FiDollarSign />,
    title: "Competitive Pricing",
    description:
      "Benefit from wholesale pricing designed to improve your retail margins.",
  },

  {
    icon: <FiRefreshCw />,
    title: "Reliable Restocking",
    description:
      "Maintain product availability through dependable inventory supply.",
  },

  {
    icon: <FiTrendingUp />,
    title: "Business Growth Support",
    description:
      "Grow your electronics business with a trusted supply partner.",
  },
];

const RetailSolution = () => {
  return (
    <section className="py-24 bg-white">
      <Container>
        <SlideUp>
          <SectionTitle
            className="text-left"
            label="RETAIL SOLUTIONS"
            title="Helping Retailers Grow With Reliable Technology Supply"
            description="From independent stores to retail chains, E-ALL provides genuine electronics, competitive pricing and dependable inventory solutions."
          />
        </SlideUp>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {features.map((item) => (
            <StaggerItem
              key={item.title}
              className="p-8 rounded-3xl bg-slate-50 hover:bg-sky-700 hover:text-white transition group"
            >
              <div className=" flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-sky-700 text-white flex items-center justify-center text-2xl group-hover:bg-white group-hover:text-sky-700">
                  {item.icon}
                </div>

                <h3 className="mt-6 font-bold text-xl">{item.title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-600 group-hover:text-sky-100">
                  {item.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Container>
    </section>
  );
};

export default RetailSolution;
