import Container from "../common/Container";
import InfoCard from "../common/InfoCard";
import {
  FiSmartphone,
  FiHeadphones,
  FiShoppingBag,
  FiBriefcase,
  FiGlobe,
  FiTruck,
} from "react-icons/fi";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";
import SlideUp from "../animations/SlideUp";
import SectionTitle from "../common/SectionTitle";

const services = [
  {
    title: "Smartphone Distribution",
    icon: <FiSmartphone />,
    badge: "Distribution",
    link: "/products",

    description:
      "Wholesale supply of Apple, Samsung, Xiaomi, Honor, Oppo, Realme, Huawei, and other globally recognized smartphone brands.",
  },

  {
    title: "Consumer Electronics",
    icon: <FiHeadphones />,
    badge: "Electronics",
    link: "/products",

    description:
      "Earbuds, smartwatches, tablets, gaming accessories, wearables, speakers, chargers, and premium electronic accessories.",
  },

  {
    title: "Wholesale Supply",
    icon: <FiShoppingBag />,
    badge: "B2B",

    link: "/contact",

    description:
      "Reliable supply solutions tailored for retailers, resellers, distributors, and online marketplaces worldwide.",
  },

  {
    title: "Corporate Procurement",
    icon: <FiBriefcase />,
    badge: "Enterprise",

    link: "/contact",

    description:
      "Customized procurement solutions for businesses, educational institutions, government agencies, and corporate organizations.",
  },

  {
    title: "International Export",
    icon: <FiGlobe />,
    badge: "Global",

    link: "/contact",

    description:
      "Export services across Africa, the GCC, the Middle East, and international markets through an efficient global network.",
  },

  {
    title: "Supply Chain Solutions",
    icon: <FiTruck />,
    badge: "Logistics",

    link: "/services",

    description:
      "Warehousing, inventory management, packaging, shipping, customs coordination, and end-to-end logistics support.",
  },
];

const ServicesGrid = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <SlideUp>
        <SectionTitle
          className=" flex flex-col items-center text-center"
          label="OUR SERVICES"
          title="Comprehensive Technology Distribution Solutions"
          description="From sourcing premium electronics to delivering complete supply chain solutions, E-ALL helps retailers, distributors, and enterprise customers grow through reliable technology partnerships."
          center
        />
      </SlideUp>
      <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <StaggerItem key={service.title}>
            <InfoCard
              icon={service.icon}
              title={service.title}
              description={service.description}
              badge={service.badge}
              link={service.link}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

export default ServicesGrid;
