import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import SlideUp from "../animations/SlideUp";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

import {
  FiMessageSquare,
  FiFileText,
  FiShoppingBag,
  FiShield,
  FiPackage,
  FiTruck,
  FiHeadphones,
} from "react-icons/fi";

const process = [
  {
    title: "Inquiry",
    description:
      "Share your product requirements, quantities, and destination with our sales team.",
    icon: <FiMessageSquare />,
  },
  {
    title: "Quotation",
    description:
      "Receive a competitive quotation tailored to your business requirements.",
    icon: <FiFileText />,
  },
  {
    title: "Product Sourcing",
    description:
      "Products are sourced from trusted global manufacturers and suppliers.",
    icon: <FiShoppingBag />,
  },
  {
    title: "Quality Inspection",
    description:
      "Every shipment is verified for authenticity and quality before dispatch.",
    icon: <FiShield />,
  },
  {
    title: "Packaging",
    description:
      "Products are securely packed to ensure safe international transportation.",
    icon: <FiPackage />,
  },
  {
    title: "Global Shipping",
    description:
      "Efficient logistics and customs coordination ensure timely delivery.",
    icon: <FiTruck />,
  },
  {
    title: "After Sales Support",
    description:
      "Dedicated customer support throughout the entire business relationship.",
    icon: <FiHeadphones />,
  },
];

const DistributionProcess = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-white">
      <SlideUp>
        <SectionTitle
          className=" text-left"
          label="OUR PROCESS"
          title="Simple, Transparent & Reliable Distribution Workflow"
          description="From your first inquiry to final delivery, every stage is carefully managed to provide a seamless business experience."
          center
        />
      </SlideUp>

      <StaggerContainer className="relative mt-20">
        {/* Desktop timeline */}
        <div className="hidden lg:block absolute top-12 left-0 right-0 h-1 bg-slate-200 rounded-full" />

        <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-10 relative">
          {process.map((step, index) => (
            <StaggerItem key={step.title}>
              <div className="relative text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-sky-700 text-white flex items-center justify-center text-3xl shadow-xl border-4 border-white">
                  {step.icon}
                </div>

                <div className="mt-6">
                  <div className="text-sm font-semibold text-sky-700 mb-2">
                    Step {index + 1}
                  </div>

                  <h3 className="font-bold text-lg text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm text-slate-600 leading-6">
                    {step.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>
    </section>
  );
};

export default DistributionProcess;
