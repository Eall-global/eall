import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import { FaTruck, FaBoxes, FaHeadset, FaGlobe } from "react-icons/fa";

const services = [
  {
    title: "Global Distribution",
    description:
      "Efficient supply chain and distribution across multiple international markets.",
    icon: <FaGlobe size={28} />,
  },
  {
    title: "Bulk Supply",
    description:
      "Wholesale and bulk purchasing solutions for retailers and enterprises.",
    icon: <FaBoxes size={28} />,
  },
  {
    title: "Fast Logistics",
    description:
      "Reliable and fast delivery systems ensuring timely product availability.",
    icon: <FaTruck size={28} />,
  },
  {
    title: "After-Sales Support",
    description:
      "Dedicated customer support for warranty and product assistance.",
    icon: <FaHeadset size={28} />,
  },
];

const Services = () => {
  return (
    <section>
      <Container className="py-20">
        <SectionTitle
          className="flex flex-col text-left"
          label="Services"
          title="End-to-End Business Solutions"
          description="We provide complete support for retailers, wholesalers, and enterprise partners."
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
          {services.map((service, index) => (
            <div
              key={index}
              className="
                bg-white
                p-6
                rounded-2xl
                shadow-sm
                hover:shadow-lg
                transition
              "
            >
              <div className="text-blue-700 mb-4">{service.icon}</div>

              <h3 className="font-semibold text-slate-800 mb-2">
                {service.title}
              </h3>

              <p className="text-slate-600 text-sm leading-6">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Services;
