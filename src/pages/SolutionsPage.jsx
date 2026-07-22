import SolutionsHero from "../components/solutions/SolutionsHero";
import SolutionsGrid from "../components/solutions/SolutionsGrid";

import RetailSolution from "../components/solutions/RetailSolution";
import WholesaleSolution from "../components/solutions/WholesaleSolution";
import CorporateSolution from "../components/solutions/CorporateSolution";
import BusinessCTA from "../components/solutions/BusinessCTA";
import FAQAccordion from "../components/common/FAQAccordion";
import SolutionsProcess from "../components/solutions/SolutionsProcess";
import IndustrySolutions from "../components/solutions/IndustrySolutions";

const SolutionsPage = () => {
  return (
    <>
      <SolutionsHero />

      <SolutionsGrid />

      <RetailSolution />

      <WholesaleSolution />

      <CorporateSolution />

      <SolutionsProcess />

      <IndustrySolutions />

      <FAQAccordion />

      <BusinessCTA />
    </>
  );
};

export default SolutionsPage;
