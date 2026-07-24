import { Link } from "react-router-dom";
import Container from "../common/Container";
import { aboutData } from "./aboutData";

const AboutHero = () => {
  return (
    <section
      className="relative min-h-[85vh] bg-cover bg-center"
      style={{
        backgroundImage: `url(${aboutData.hero.image})`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-950/80" />

      <div className="relative z-10 flex h-162.5 items-center p-6 lg:p-10 text-left">
        <div className="max-w-4xl">
          {/* <span className="uppercase tracking-[5px] text-sky-400 font-semibold">
            About E-ALL
          </span> */}

          <h1 className="mt-5 text-5xl md:text-6xl font-bold text-white leading-tight">
            {aboutData.hero.subtitle}
          </h1>

          <p className="mt-8 text-lg leading-8 text-slate-200">
            {aboutData.hero.description}
          </p>

          <div className="mt-10 flex flex-wrap gap-5">
            <Link
              to="/products"
              className="px-8 py-4 rounded-xl bg-sky-700 text-white font-semibold hover:bg-sky-800 transition"
            >
              Explore Products
            </Link>

            <Link
              to="/contact"
              className="px-8 py-4 rounded-xl border border-white text-white hover:bg-white hover:text-slate-900 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
