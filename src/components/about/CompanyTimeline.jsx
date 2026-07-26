import { timeline } from "./aboutData";

import SlideUp from "../animations/SlideUp";
import StaggerContainer from "../animations/StaggerContainer";
import StaggerItem from "../animations/StaggerItem";
import SectionTitle from "../common/SectionTitle";

const CompanyTimeline = () => {
  return (
    <section className="px-6 lg:px-10 py-10 lg:py-16 bg-white">
      {/* HEADER */}

      <SlideUp>
        <SectionTitle
          className="flex flex-col items-center text-center"
          label="OUR JOURNEY"
          title="From Experience To Excellence"
          description="
            Built on years of trading expertise, E-ALL continues to expand its
            technology distribution network globally.
          "
        />
      </SlideUp>

      {/* ================= DESKTOP HORIZONTAL TIMELINE ================= */}

      <div className="hidden lg:block mt-16">
        <StaggerContainer
          className="
      relative
      mx-auto
      h-105
      flex
      items-center
    "
        >
          {/* Horizontal Line */}

          <div
            className="
        absolute
        left-0
        right-0
        top-1/2
        h-1
        bg-sky-200
      "
          />

          <div
            className="
        relative
        w-full
        flex
        justify-evenly
      "
          >
            {timeline.map((item, index) => (
              <StaggerItem key={item.year}>
                <div
                  className="
                relative
                flex
                flex-col
                items-center
              "
                >
                  {/* CONTENT ABOVE */}

                  {index % 2 === 0 && (
                    <div
                      className="
                      absolute
                      bottom-10
                      w-64
                      text-center
                    "
                    >
                      <div
                        className="
                        bg-white
                        rounded-xl
                        shadow-md
                        p-5
                      "
                      >
                        <span
                          className="
                          text-sky-700
                          font-bold
                          text-xl
                        "
                        >
                          {item.year}
                        </span>

                        <h3
                          className="
                          mt-2
                          font-semibold
                          text-slate-900
                        "
                        >
                          {item.title}
                        </h3>

                        <p
                          className="
                          mt-2
                          text-sm
                          text-slate-600
                        "
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CONTENT BELOW */}

                  {index % 2 !== 0 && (
                    <div
                      className="
                      absolute
                      top-10
                      w-64
                      text-center
                    "
                    >
                      <div
                        className="
                        bg-white
                        rounded-xl
                        shadow-md
                        p-5
                      "
                      >
                        <span
                          className="
                          text-sky-700
                          font-bold
                          text-xl
                        "
                        >
                          {item.year}
                        </span>

                        <h3
                          className="
                          mt-2
                          font-semibold
                          text-slate-900
                        "
                        >
                          {item.title}
                        </h3>

                        <p
                          className="
                          mt-2
                          text-sm
                          text-slate-600
                        "
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CONNECTOR */}

                  <div
                    className="
                  absolute
                  top-1/2
                  -translate-y-1/2
                  w-px
                  h-10
                  bg-sky-300
                "
                  />

                  {/* DOT */}

                  <div
                    className="
                  relative
                  z-10
                  w-6
                  h-6
                  rounded-full
                  bg-sky-700
                  border-4
                  border-white
                  shadow-lg
                "
                  />
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </div>

      {/* ================= MOBILE TIMELINE ================= */}

      <StaggerContainer
        className="
          lg:hidden
          relative
          mt-14
          ml-4
        "
      >
        {/* Vertical Line */}

        <div
          className="
            absolute
            left-3
            top-0
            bottom-0
            w-0.5
            bg-sky-200
          "
        />

        {timeline.map((item) => (
          <StaggerItem key={item.year}>
            <div
              className="
                  relative
                  flex
                  gap-8
                  mb-12
                "
            >
              {/* DOT */}

              <div
                className="
                    relative
                    z-10
                    w-7
                    h-7
                    rounded-full
                    bg-sky-700
                    border-4
                    border-white
                    shadow-lg
                    shrink-0
                  "
              />

              {/* CONTENT */}

              <div
                className="
                    bg-white
                    rounded-2xl
                    shadow-sm
                    p-6
                    flex-1
                  "
              >
                <span
                  className="
                      text-sky-700
                      font-bold
                      text-xl
                    "
                >
                  {item.year}
                </span>

                <h3
                  className="
                      mt-3
                      text-xl
                      font-semibold
                      text-slate-900
                    "
                >
                  {item.title}
                </h3>

                <p
                  className="
                      mt-3
                      text-slate-600
                      leading-7
                    "
                >
                  {item.description}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

export default CompanyTimeline;
