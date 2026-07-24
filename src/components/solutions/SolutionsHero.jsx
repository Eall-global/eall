import Container from "../common/Container";

import { Link } from "react-router-dom";

import SlideUp from "../animations/SlideUp";

const SolutionsHero = () => {
  return (
    <section
      className="relative min-h-[85vh] bg-cover bg-center"
      style={{
        backgroundImage: "url('/solutions/hero.png')",
      }}
    >
      <div className="absolute inset-0 bg-slate-900/70" />

      <SlideUp>
        <div className="relative z-10 flex h-162.5 items-center p-6 lg:p-10 text-left">
          <div className="max-w-3xl mt-20 text-white">
            {/* <span className=" inline-block text-sm font-semibol">
              BUSINESS SOLUTIONS
            </span> */}

            <h1 className="mt-8 text-5xl lg:text-7xl font-black leading-tight">
              Technology Solutions Designed For Growth
            </h1>

            <p className="mt-6 text-xl text-slate-200 leading-8">
              Partner with E-ALL for reliable electronics sourcing,
              distribution, and business technology solutions.
            </p>

            <div className="mt-10 flex flex-wrap gap-5">
              <Link
                to="/contact"
                className="bg-sky-700 w-fit hover:bg-sky-800 text-white px-8 py-4 rounded-2xl font-semibold"
              >
                Request Consultation
              </Link>

              <Link
                to="/products"
                className="  border w-fit border-white px-8 py-4 rounded-2xl hover:bg-white hover:text-slate-900 transition  "
              >
                View Products
              </Link>
            </div>
          </div>
        </div>
      </SlideUp>
    </section>
  );
};

export default SolutionsHero;
