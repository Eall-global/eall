import Container from "../common/Container";

import { solutions } from "./solutionsData";

import SolutionCard from "./SolutionCard";

import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";
import SlideUp from "../animations/SlideUp";
import SectionTitle from "../common/SectionTitle";

const SolutionsGrid = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <SlideUp>
        <SectionTitle
          className=" flex flex-col items-center text-center"
          label="BUSINESS SOLUTIONS"
          title="Solutions Built Around Your Business Needs"
          description="Whether you are a retailer, distributor, enterprise organization, or international buyer, E-ALL provides flexible technology supply solutions."
          center
        />
      </SlideUp>
      <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {solutions.map((solution) => (
          <StaggerItem key={solution.title}>
            <SolutionCard
              icon={solution.icon}
              title={solution.title}
              description={solution.description}
              badge={solution.badge}
              link={solution.link}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

export default SolutionsGrid;
