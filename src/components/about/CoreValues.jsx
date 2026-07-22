import Container from "../common/Container";
import { coreValues } from "./aboutData";

import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";
import SectionTitle from "../common/SectionTitle";

const CoreValues = () => {
  return (
    <section className=" px-6 lg:px-10 py-10 lg:py-16 bg-gray-100">
      <SectionTitle
        className=" flex flex-col text-center items-center"
        label="Our Core Values"
        description="The principles that define our partnerships and operations."
      />

      <StaggerContainer className=" grid md:grid-cols-2 lg:grid-cols-3 gap-8 ">
        {coreValues.map((value) => (
          <StaggerItem
            key={value.title}
            className=" bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition border border-slate-100 "
          >
            <h3 className=" text-xl font-bold text-slate-900 ">
              {value.title}
            </h3>

            <p className=" mt-4 text-slate-600 leading-7 ">
              {value.description}
            </p>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

export default CoreValues;
