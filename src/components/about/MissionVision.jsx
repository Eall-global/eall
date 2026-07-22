import Container from "../common/Container";
import SlideUp from "../animations/SlideUp";
import { missionVision } from "./aboutData";

import { FiTarget, FiEye } from "react-icons/fi";

const MissionVision = () => {
  return (
    <section className=" px-6 lg:px-10 py-10 lg:py-16 bg-white">
      <SlideUp>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Mission */}

          <div className="relative rounded-3xl bg-slate-900 p-10 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-sky-700/20 translate-y-1/2 -translate-x-1/4"></div>
            <h3 className="text-3xl font-bold mb-2">Our Mission</h3>

            <p className="mt-5 text-slate-300 leading-8">
              {missionVision.mission}
            </p>
          </div>

          {/* Vision */}

          <div className="relative rounded-3xl bg-sky-700 p-10 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-slate-900/20 translate-y-1/2 -translate-x-1/4"></div>
            <h3 className="text-3xl font-bold mb-2">Our Vision</h3>

            <p className="mt-5 text-sky-100 leading-8">
              {missionVision.vision}
            </p>
          </div>
        </div>
      </SlideUp>
    </section>
  );
};

export default MissionVision;
