import Container from "../common/Container";
import { markets } from "./aboutData";

import SlideUp from "../animations/SlideUp";
import SectionTitle from "../common/SectionTitle";

const MarketsSection = () => {
  return (
    <section className=" px-6 lg:px-10 py-10 lg:py-16 bg-white">
      <SlideUp>
        <SectionTitle
          className=" flexx flex-col text-left"
          label="  Markets We Serve"
          description=" Connecting businesses across multiple international regions."
        />
      </SlideUp>

      <div className=" grid grid-cols-2 md:grid-cols-5 gap-6 mt-14 ">
        {markets.map((market) => (
          <div
            key={market}
            className=" rounded-2xl bg-slate-50 p-8 text-center font-semibold text-slate-700 hover:bg-sky-700 hover:text-white transition "
          >
            {market}
          </div>
        ))}
      </div>
    </section>
  );
};

export default MarketsSection;
