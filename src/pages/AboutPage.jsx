import AboutHero from "../components/about/AboutHero";
import CompanyStory from "../components/about/CompanyStory";
import CompanyStats from "../components/about/CompanyStats";
import CompanyTimeline from "../components/about/CompanyTimeline";
import MissionVision from "../components/about/MissionVision";
import CoreValues from "../components/about/CoreValues";

import WhyChooseUs from "../components/about/WhyChooseUs";
import BusinessSolutions from "../components/about/BusinessSolutions";
import GlobalCoverage from "../components/services/GlobalCoverage";

const AboutPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <AboutHero />

      <CompanyStory />

      <CompanyStats />

      <CompanyTimeline />

      <MissionVision />

      <CoreValues />

      <WhyChooseUs />

      <BusinessSolutions />

      <GlobalCoverage />
    </div>
  );
};

export default AboutPage;
