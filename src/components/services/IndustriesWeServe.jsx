import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import InfoCard from "../common/InfoCard";

import SlideUp from "../animations/SlideUp";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

import {
  FiShoppingCart,
  FiBox,
  FiBriefcase,
  FiBook,
  FiGlobe,
  FiCpu,
} from "react-icons/fi";

const industries = [
  {
    icon: <FiShoppingCart />,
    title: "Retail Chains",
    badge: "Retail",
    description:
      "Reliable supply of smartphones and electronics for retail outlets and chain stores.",
  },
  {
    icon: <FiBox />,
    title: "Wholesale Distributors",
    badge: "Wholesale",
    description:
      "Bulk purchasing solutions with competitive pricing and consistent inventory availability.",
  },
  {
    icon: <FiBriefcase />,
    title: "Corporate Procurement",
    badge: "Enterprise",
    description:
      "Technology procurement for businesses, banks, healthcare organizations, and enterprises.",
  },
  {
    icon: <FiBook />,
    title: "Educational Institutions",
    badge: "Education",
    description:
      "Supplying tablets, laptops, accessories, and technology solutions for schools and universities.",
  },
  {
    icon: <FiGlobe />,
    title: "Government Projects",
    badge: "Public Sector",
    description:
      "Trusted sourcing partner for government departments and public sector technology initiatives.",
  },
  {
    icon: <FiCpu />,
    title: "Telecommunication Partners",
    badge: "Telecom",
    description:
      "Providing mobile devices and accessories for telecom operators and service providers.",
  },
];

const IndustriesWeServe = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <SlideUp>
        <SectionTitle
          className=" flex flex-col text-center items-center"
          label="WHO WE SERVE"
          title="Industries We Empower"
          description="Our flexible sourcing and distribution capabilities support organizations across multiple industries worldwide."
          center
        />
      </SlideUp>

      <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
        {industries.map((industry) => (
          <StaggerItem key={industry.title}>
            <InfoCard
              icon={industry.icon}
              title={industry.title}
              badge={industry.badge}
              description={industry.description}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

export default IndustriesWeServe;
