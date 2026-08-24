import Container from "../common/Container";
import FooterTopCTA from "../footer/FooterTopCTA";
import FooterCompany from "../footer/FooterCompany";
import FooterProducts from "../footer/Footerproducts";
import FooterSolutions from "../footer/FooterSolutions";
import FooterSupport from "../footer/FooterSupport";
import FooterTrustBar from "../footer/FooterTrustBar";
import FooterBottom from "../footer/FooterBottom";

const Footer = () => {
  return (
    <>
      <FooterTopCTA />

      <footer className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto p-6 sm:p-8 lg:p-12 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12">
          
          {/* Company (Spans full width on mobile/tablet, 2 cols on desktop) */}
          <div className="col-span-2 lg:col-span-2 text-left">
            <FooterCompany />
          </div>

          {/* Solutions Column */}
          <div className="col-span-1 text-left">
            <FooterSolutions />
          </div>

          {/* Support Column */}
          <div className="col-span-1 text-left">
            <FooterSupport />
          </div>

          {/* Products Column */}
          <div className="col-span-2 sm:col-span-1 text-left">
            <FooterProducts />
          </div>
        </div>

        {/* 4 Trust Badges */}
        <FooterTrustBar />

        {/* Legal & Social Bottom Bar */}
        <FooterBottom />
      </footer>
    </>
  );
};

export default Footer;
