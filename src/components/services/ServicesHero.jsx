import { Link } from "react-router-dom";
import Container from "../common/Container";
import SlideUp from "../animations/SlideUp";

const ServicesHero = () => {
  return (
    <section
      className="relative min-h-[85vh] bg-cover bg-center "
      style={{
        backgroundImage: "url('/services/hero.png')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/80" />

      <SlideUp>
        <div className="relative z-10 flex h-162.5 items-center p-6 lg:p-10 text-left">
          <div className=" max-w-4xl mt-20">
            {/* <span className=" inline-block text-sm font-semibol">
              BUSINESS SOLUTIONS
            </span> */}

            <h1 className=" mt-4! text-5xl lg:text-7xl font-black leading-tight ">
              Technology Distribution
              <br />& Supply Solutions
            </h1>

            <p className=" mt-8 text-xl text-slate-200 leading-8 ">
              Supporting retailers, wholesalers, distributors and enterprise
              customers with genuine electronics, reliable sourcing, and global
              supply chain solutions.
            </p>

            <div className="mt-10 flex flex-wrap gap-5">
              <Link
                to="/contact"
                className=" bg-sky-700 hover:bg-sky-800 px-8 py-4 rounded-xl text-white font-semibold transition "
              >
                Request Quote
              </Link>

              <Link
                to="/products"
                className="  border border-white px-8 py-4 rounded-xl hover:bg-white hover:text-slate-900 transition  "
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

export default ServicesHero;
