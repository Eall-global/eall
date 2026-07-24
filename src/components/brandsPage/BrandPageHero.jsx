import { FiSearch } from "react-icons/fi";

import Container from "../common/Container";
import SlideUp from "../animations/SlideUp";
import BrandCollage from "./BrandCollage";

const BrandPageHero = ({ totalBrands, totalProducts, onSearch, search }) => {
  return (
    <section
      className="
       bg-white
        py-20
        px-6  lg:px-10
    
      "
    >
      <div
        className="
            grid
            lg:grid-cols-2
            gap-12
            items-center
            text-left
          "
      >
        {/* LEFT CONTENT */}

        <SlideUp>
          <span
            className="
                inline-block
                text-sm
                font-semibold
                text-sky-700
                uppercase
                tracking-wider
              "
          >
            Global Technology Partners
          </span>

          <h1
            className="
                mt-5
                text-4xl
                lg:text-5xl
                font-bold
                text-slate-900!
                leading-tight
              "
          >
            Leading Brands.
            <br />
            Trusted Partnerships.
          </h1>

          <p
            className="
                mt-6
                text-slate-600
                leading-7
                max-w-xl
              "
          >
            We collaborate with globally recognized manufacturers to provide
            genuine smartphones, consumer electronics, enterprise solutions and
            accessories for retail, wholesale and corporate customers.
          </p>
          {/* STATS */}

          <div
            className="
                mt-10
                flex
                gap-10
              "
          >
            <div>
              <h3
                className="
                    text-3xl
                    font-bold
                    text-slate-900
                  "
              >
                {totalBrands}+
              </h3>

              <p className="text-sm text-slate-500">Global Brands</p>
            </div>

            <div>
              <h3
                className="
                    text-3xl
                    font-bold
                    text-slate-900
                  "
              >
                {totalProducts}+
              </h3>

              <p className="text-sm text-slate-500">Products</p>
            </div>

            <div>
              <h3
                className="
                    text-3xl
                    font-bold
                    text-slate-900
                  "
              >
                50+
              </h3>

              <p className="text-sm text-slate-500">Countries</p>
            </div>
          </div>
        </SlideUp>

        <BrandCollage />
      </div>
    </section>
  );
};

export default BrandPageHero;
