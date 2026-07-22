import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import SlideUp from "../animations/SlideUp";

const regions = [
  {
    title: "Middle East",
    description: "Strong regional presence through UAE operations.",
  },

  {
    title: "Africa",
    description: "Supporting growing technology markets across Africa.",
  },

  {
    title: "GCC",
    description: "Serving businesses across Gulf countries.",
  },

  {
    title: "Asia",
    description: "Global sourcing network across Asian markets.",
  },

  {
    title: "International",
    description: "Expanding technology partnerships worldwide.",
  },
];

const GlobalCoverage = () => {
  return (
    <section className=" px-6 py-10 lg:px-10 lg:py-16 bg-white">
      <SlideUp>
        <SectionTitle
          className=" flex flex-col items-center text-center"
          label="GLOBAL REACH"
          title="Markets We Serve"
          description="Connecting technology suppliers and business partners across multiple international regions."
          center
        />
      </SlideUp>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-6">
        {regions.map((region) => (
          <div
            key={region.title}
            className=" bg-white shadow-xs hover:shadow-sm p-6 rounded-2xl border border-slate-100 transition"
          >
            <h3 className="font-bold text-xl">{region.title}</h3>

            <p className="mt-4 text-sm text-slate-600">{region.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GlobalCoverage;
