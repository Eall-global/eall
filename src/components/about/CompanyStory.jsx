import Container from "../common/Container";
import { aboutData } from "./aboutData";

const CompanyStory = () => {
  return (
    <section className="px-6 lg:px-10 py-10 lg:py-16 bg-white">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* LEFT IMAGE */}

        <div className="relative">
          <img
            src={aboutData.story.image}
            alt="Company Story"
            className="rounded-3xl shadow-2xl w-full object-cover h-120"
          />

          {/* Floating Card */}

          <div
            className="
                absolute
                -bottom-8
                right-8
                bg-white
                rounded-2xl
                shadow-xl
                p-6
                border
                border-slate-100
              "
          >
            <h3 className="text-4xl font-bold text-sky-700">15+</h3>

            <p className="text-slate-600 font-medium">
              Years of Trading Excellence
            </p>

            <span className="text-sm text-slate-500">Since 2008</span>
          </div>
        </div>

        {/* RIGHT CONTENT */}

        <div>
          <span className="uppercase tracking-wider text-[#FF5500] font-semibold text-[12px] mb-3">
            OUR STORY
          </span>

          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900! mt-6 leading-tight">
            Building Trust Through
            <span className="text-sky-700"> Technology & Partnerships</span>
          </h2>

          <div className="w-24 h-1 bg-sky-600 rounded-full mt-6"></div>

          <div className="mt-8 space-y-6">
            {aboutData.story.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-slate-600 leading-8 text-justify">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyStory;
