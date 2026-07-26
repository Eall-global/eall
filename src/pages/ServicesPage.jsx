import ServicesHero from "../components/services/ServicesHero";
import ServicesGrid from "../components/services/ServicesGrid";
import DistributionProcess from "../components/services/DistributionProcess";
import IndustriesWeServe from "../components/services/IndustriesWeServe";
import WhyBusinessesChooseUs from "../components/services/WhyBusinessesChooseUs";
import GlobalCoverage from "../components/services/GlobalCoverage";
import CTASection from "../components/common/CTASection";
import FAQAccordion from "../components/common/FAQAccordion";

const ServicesPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <ServicesHero />

      <ServicesGrid />

      <DistributionProcess />

      <IndustriesWeServe />

      <WhyBusinessesChooseUs />

      <FAQAccordion />

      <GlobalCoverage />

      <CTASection />
    </div>
  );
};

export default ServicesPage;
