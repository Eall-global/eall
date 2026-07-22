import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import SlideUp from "../animations/SlideUp";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

import { industries } from "./industryData";

const IndustrySolutions = () => {
  return (
    <section className="py-24 bg-white">
      <Container>
        {/* HEADER */}
        <SlideUp>
          <SectionTitle
            className=" text-left"
            label="INDUSTRIES WE SUPPORT"
            title="Solutions Designed Around Your Business Needs"
            description="
              Every industry has different challenges.
              E-ALL provides tailored technology supply solutions
              built around your operational requirements.
            "
            center
          />
        </SlideUp>

        {/* INDUSTRY BLOCKS */}
        <div className="mt-20 space-y-24">
          {industries.map((industry, index) => {
            const Icon = industry.icon;

            const reverse = index % 2 !== 0;

            return (
              <StaggerContainer
                key={industry.id}
                className={` grid lg:grid-cols-2  gap-12 items-center `}
              >
                {/* IMAGE SECTION */}

                <StaggerItem className={reverse ? "lg:order-2" : "lg:order-1"}>
                  <div className="  relative  overflow-hidden rounded-3xl shadow-xl group ">
                    <img
                      src={industry.image}
                      alt={industry.title}
                      className=" w-full h-105 object-cover transition duration-700 group-hover:scale-110
                        "
                    />

                    {/* Overlay */}

                    <div className=" absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                    {/* Icon */}

                    <div
                      className="absolute bottom-6 left-6  w-16  h-16  rounded-2xl  bg-white  text-sky-700  flex  items-center justify-center text-3xl shadow-lg
                        "
                    >
                      <Icon />
                    </div>
                  </div>
                </StaggerItem>

                {/* CONTENT SECTION */}

                <StaggerItem className={reverse ? "lg:order-1" : "lg:order-2"}>
                  <div className=" text-left">
                    <span
                      className="
                          inline-block
                          text-sm
                          font-semibold
                          text-sky-700
                          bg-sky-100
                          px-4
                          py-2
                          rounded-full
                        "
                    >
                      {industry.title}
                    </span>

                    <h3
                      className="
                          mt-4
                          text-2xl
                          lg:text-3xl
                          text-slate-900
                        "
                    >
                      Empowering {industry.title}
                    </h3>

                    {/* Challenge */}

                    <div className="mt-6">
                      <h4
                        className="
                            font-bold
                            text-slate-900
                          "
                      >
                        Business Challenge
                      </h4>

                      <p
                        className="
                            mt-3
                            text-slate-600
                            leading-7
                          "
                      >
                        {industry.challenge}
                      </p>
                    </div>

                    {/* Solution */}

                    <div className="mt-6">
                      <h4
                        className="
                            font-bold
                            text-slate-900
                          "
                      >
                        E-ALL Solution
                      </h4>

                      <p
                        className="
                            mt-3
                            text-slate-600
                            leading-7
                          "
                      >
                        {industry.solution}
                      </p>
                    </div>

                    {/* Products */}

                    <div className="mt-6">
                      <h4
                        className="
                            font-bold
                            text-slate-900
                            mb-4
                          "
                      >
                        Typical Products
                      </h4>

                      <div
                        className="
                            flex
                            flex-wrap
                            gap-3
                          "
                      >
                        {industry.products.map((product) => (
                          <span
                            key={product}
                            className="  px-4 py-2  rounded-full  bg-slate-100  text-sm  text-slate-700  font-medium    "
                          >
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}

                    <Link
                      to="/contact"
                      className=" inline-flex  items-center  gap-3  mt-6  bg-sky-700  text-white  px-7  py-3  rounded-xl  font-semibold  hover:bg-cyan-700  transition"
                    >
                      Discuss Your Requirement
                      <FiArrowRight />
                    </Link>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default IndustrySolutions;
