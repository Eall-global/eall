import Container from "../common/Container";

import FooterTopCTA from "../footer/FooterTopCTA";
import FooterCompany from "../footer/FooterCompany";

import FooterProducts from "../footer/Footerproducts";
import FooterSolutions from "../footer/FooterSolutions";
import FooterSupport from "../footer/FooterSupport";
import FooterTrustBar from "../footer/FooterTrustBar";
import FooterBottom from "../footer/FooterBottom";
import FooterContact from "../footer/FooterContact";

const Footer = () => {
  return (
    <>
      <FooterTopCTA />

      <footer className="bg-slate-950">
        <div className="p-6 lg:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Company */}
          <div className="lg:col-span-2">
            <FooterCompany />
          </div>

          {/* Products */}
          <FooterProducts />

          {/* Solutions */}
          <FooterSolutions />

          {/* Support */}
          <FooterSupport />
        </div>

        <FooterTrustBar />

        <FooterBottom />
      </footer>
    </>
  );
};

export default Footer;
