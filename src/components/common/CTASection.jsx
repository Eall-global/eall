import Container from "../common/Container";

import SlideUp from "../animations/SlideUp";

import { Link } from "react-router-dom";

import { FiArrowRight, FiMessageSquare } from "react-icons/fi";

const CTASection = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-gray-100">
      <SlideUp>
        <div
          className="relative rounded-3xl bg-slate-900 p-12 md:p-20 overflow-hidden"
          style={{ opacity: 1, transform: "none" }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-sky-700/20 translate-y-1/2 -translate-x-1/4"></div>
          <div className="relative z-10 max-w-2xl text-left">
            <h2 className=" mt-8 text-4xl md:text-5xl font-bold text-white  ">
              Ready To Grow Your Technology Business?
            </h2>

            <p className=" mt-6  max-w-2xl mx-auto text-slate-300  text-lg leading-8  ">
              Partner with Electronics All (E-ALL) for genuine electronics
              products, competitive pricing, and dependable global supply
              solutions.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#FF5500] text-white font-semibold text-sm hover:bg-[#e64d00] transition-all duration-300"
                href="/contact"
              >
                Request A Quote
                <FiArrowRight />
              </Link>

              <Link
                to="/products"
                className=" px-8 py-4 rounded-xl border border-white/30 text-white hover:bg-white hover:text-slate-900 transition font-semibold "
              >
                Explore Products
              </Link>
            </div>
          </div>
        </div>
      </SlideUp>
    </section>
  );
};

export default CTASection;
