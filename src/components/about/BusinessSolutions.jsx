import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import { businessSolutions } from "./aboutData";

import SolutionCard from "./SolutionCard";

import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";

const BusinessSolutions = () => {
  const leftSolutions = businessSolutions.slice(0, 3);

  const rightSolutions = businessSolutions.slice(3, 6);

  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <SectionTitle
        className=" flex flex-col items-center text-center"
        label="OUR SOLUTIONS"
        title="Solutions Designed For Modern Businesses"
        description="
From sourcing and distribution to enterprise procurement,
E-ALL delivers complete technology supply solutions.
"
      />

      <div className="mt-16 grid lg:grid-cols-3 gap-10 items-center">
        {/* LEFT */}

        <StaggerContainer className="space-y-6">
          {leftSolutions.map((item) => (
            <StaggerItem key={item.title}>
              <SolutionCard item={item} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* CENTER IMAGE */}

        <div className="hidden lg:flex flex-col items-center justify-center">
          <div className="relative w-72 h-72 rounded-full overflow-hidden shadow-2xl">
            <img
              src="/about/solution.jpeg"
              alt="E-ALL Business Solutions"
              className="
w-full
h-full
object-cover
"
            />
          </div>

          <div
            className="
mt-8
text-center
"
          >
            <h3
              className="
text-2xl
font-black
text-slate-900
"
            >
              E-ALL
            </h3>

            <p
              className="
mt-2
text-sky-700
font-semibold
"
            >
              Your Technology Supply Partner
            </p>
          </div>
        </div>

        {/* RIGHT */}

        <StaggerContainer
          className="
space-y-6
"
        >
          {rightSolutions.map((item) => (
            <StaggerItem key={item.title}>
              <SolutionCard item={item} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* MOBILE IMAGE */}

      <div
        className="
lg:hidden
mt-12
flex
justify-center
"
      >
        <div
          className="
w-64
h-64
rounded-full
overflow-hidden
shadow-xl
"
        >
          <img
            src="/images/about/solution-center.webp"
            alt="E-ALL"
            className="
w-full
h-full
object-cover
"
          />
        </div>
      </div>
    </section>
  );
};

export default BusinessSolutions;
