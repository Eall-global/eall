import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import SlideUp from "../animations/SlideUp";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

import {
  FiClipboard,
  FiUsers,
  FiFileText,
  FiShoppingBag,
  FiShield,
  FiTruck,
  FiHeadphones,
} from "react-icons/fi";

const process = [
  {
    step: "01",
    title: "Business Requirement",
    icon: FiClipboard,
    description:
      "Tell us your product requirements, preferred brands, quantities, destination and expected delivery schedule.",
  },

  {
    step: "02",
    title: "Consultation",
    icon: FiUsers,
    description:
      "Our sales specialists evaluate your requirements and recommend the best sourcing strategy.",
  },

  {
    step: "03",
    title: "Quotation",
    icon: FiFileText,
    description:
      "Receive a transparent commercial quotation with pricing, availability and delivery terms.",
  },

  {
    step: "04",
    title: "Global Sourcing",
    icon: FiShoppingBag,
    description:
      "Products are sourced through trusted manufacturers and authorized distribution partners.",
  },

  {
    step: "05",
    title: "Quality Inspection",
    icon: FiShield,
    description:
      "Every shipment undergoes authenticity verification and quality inspection before dispatch.",
  },

  {
    step: "06",
    title: "International Logistics",
    icon: FiTruck,
    description:
      "Documentation, export coordination, customs support and worldwide shipment management.",
  },

  {
    step: "07",
    title: "After-Sales Support",
    icon: FiHeadphones,
    description:
      "Dedicated account management and long-term support after every successful delivery.",
  },
];

const SolutionsProcess = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <SlideUp>
        <SectionTitle
          className=" flex flex-col text-center items-center"
          label="OUR PROCESS"
          title="A Reliable Business Workflow From Inquiry To Delivery"
          description="Every project follows a structured workflow designed to ensure transparency, quality, and timely execution for our partners."
          center
        />
      </SlideUp>

      {/* Desktop Timeline */}
      <div className="hidden lg:block mt-20 relative">
        {/* Center Line */}
        <div className="absolute top-12 left-0 right-0 h-1 bg-slate-200 rounded-full" />

        <StaggerContainer className="grid grid-cols-7 gap-6 relative z-10">
          {process.map((item) => {
            const Icon = item.icon;

            return (
              <StaggerItem key={item.step}>
                <div className="text-center group">
                  {/* Circle */}
                  <div
                    className="
                        w-20
                        h-20
                        mx-auto
                        rounded-full
                        bg-white
                        border-4
                        border-sky-700
                        shadow-lg
                        flex
                        items-center
                        justify-center
                        transition-all
                        duration-300
                        group-hover:bg-sky-700
                        group-hover:text-white
                      "
                  >
                    <Icon className="text-3xl" />
                  </div>

                  <div className="mt-5">
                    <span
                      className="
                          inline-block
                          text-xs
                          font-bold
                          text-sky-700
                          bg-sky-100
                          px-3
                          py-1
                          rounded-full
                        "
                    >
                      STEP {item.step}
                    </span>

                    <h3 className="mt-4 font-bold text-lg text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-xs leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>

      {/* Mobile Timeline */}
      <div className="lg:hidden mt-14">
        <StaggerContainer className="space-y-8">
          {process.map((item, index) => {
            const Icon = item.icon;

            return (
              <StaggerItem key={item.step}>
                <div className="flex gap-6">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div
                      className="
                          w-16
                          h-16
                          rounded-full
                          bg-sky-700
                          text-white
                          flex
                          items-center
                          justify-center
                          shadow-lg
                        "
                    >
                      <Icon className="text-2xl" />
                    </div>

                    {index !== process.length - 1 && (
                      <div className="w-1 flex-1 bg-sky-200 min-h-16 mt-2 rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-8">
                    <span className="text-xs font-bold text-sky-700">
                      STEP {item.step}
                    </span>

                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-slate-600 leading-7">
                      {item.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default SolutionsProcess;
