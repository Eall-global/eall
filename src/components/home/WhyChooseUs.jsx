import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import { FaCheckCircle } from "react-icons/fa";
import { GoGlobe } from "react-icons/go";
import { MdOutlineShield } from "react-icons/md";
import { LuTruck, LuClock } from "react-icons/lu";

const WhyChooseUs = () => {
  return (
    <section>
      <Container className="py-20 bg-gray-100!">
        <SectionTitle
          className="flex flex-col items-center text-center"
          label="Why E-ALL"
          title="Built for business"
          description="More than a distributor — a technology partner committed to your growth and success."
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center group" style={{ opacity: 1 }}>
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#0047D5]/10 to-[#FF5500]/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-500">
              <GoGlobe className="text-2xl text-sky-700 font-bold" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Global Reach
            </h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Distribution network spanning multiple countries and regions with
              local expertise.
            </p>
          </div>
          <div className="text-center group" style={{ opacity: 1 }}>
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#0047D5]/10 to-[#FF5500]/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-500">
              <MdOutlineShield className="text-2xl text-sky-700 font-bold" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Authorized Partner
            </h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Official authorized distributor for all major brands — guaranteed
              authenticity.
            </p>
          </div>
          <div className="text-center group" style={{ opacity: 1 }}>
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#0047D5]/10 to-[#FF5500]/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-500">
              <LuTruck className="text-2xl text-sky-700 font-bold" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Rapid Fulfillment
            </h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Optimized logistics ensuring fast delivery from warehouse to your
              business.
            </p>
          </div>
          <div className="text-center group" style={{ opacity: 1 }}>
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#0047D5]/10 to-[#FF5500]/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-500">
              <LuClock className="text-2xl text-sky-700 font-bold" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Dedicated Support
            </h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              24/7 account management with personalized service for every
              partner.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default WhyChooseUs;
