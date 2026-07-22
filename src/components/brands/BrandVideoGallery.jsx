import { useEffect, useRef, useState } from "react";
import Container from "../common/Container";

const BrandVideoGallery = ({ videos = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef([]);

  const total = videos.length;

  useEffect(() => {
    const current = videoRefs.current[activeIndex];

    if (!current) return;

    current.pause();
    current.currentTime = 0;

    current.play().catch(() => {});
  }, [activeIndex]);
  const nextVideo = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const selectVideo = (index) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
  };

  if (!videos.length) return null;

  const getPosition = (index) => {
    if (index === activeIndex) return "center";

    if (index === (activeIndex - 1 + total) % total) {
      return "left";
    }

    if (index === (activeIndex + 1) % total) {
      return "right";
    }

    return "hidden";
  };

  useEffect(() => {
    const current = videoRefs.current[activeIndex];

    if (!current) return;

    current.volume = 1; // 60%
  }, [activeIndex]);

  return (
    <section className="py-16 bg-white overflow-hidden">
      <Container>
        <div className="mb-10 text-center">
          {/* <h2 className="text-3xl font-bold text-slate-900!">Brand Videos</h2> */}

          <p className="text-slate-500 mt-2">
            Explore the latest products and innovations.
          </p>
        </div>

        <div
          className="
          relative
          h-150
          flex
          items-center
          justify-center
        "
        >
          {videos.map((video, index) => {
            const position = getPosition(index);

            return (
              <div
                key={video.id || index}
                onClick={() => selectVideo(index)}
                className={`
                  absolute
                  transition-all
                  duration-700
                  ease-in-out
                  cursor-pointer

                  ${
                    position === "center"
                      ? `
                        z-30
                        scale-100
                        opacity-100
                      `
                      : ""
                  }

                  ${
                    position === "left"
                      ? `
                        z-10
                        -translate-x-105
                        -rotate-12
                        scale-75
                        opacity-60
                        blur-[2px]
                      `
                      : ""
                  }

                  ${
                    position === "right"
                      ? `
                        z-10
                        translate-x-105
                        rotate-12
                        scale-75
                        opacity-60
                        blur-[2px]
                        
                      `
                      : ""
                  }

                  ${
                    position === "hidden"
                      ? `
                        opacity-0
                        scale-50
                      `
                      : ""
                  }

                `}
              >
                <video
                  key={activeIndex}
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={video.video || video.url}
                  poster={video.thumbnail}
                  muted
                  playsInline
                  preload="metadata"
                  controls={position === "center"}
                  autoPlay={position === "center"}
                  onEnded={nextVideo}
                  className="
                    w-140
                    h-150
                    object-cover
                    rounded-4xl
                    shadow-2xl
                    bg-black
                  "
                />
              </div>
            );
          })}
        </div>

        {/* Indicators */}

        <div
          className="
          flex
          justify-center
          gap-2
          mt-6
        "
        >
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => selectVideo(index)}
              className={`
                h-2
                rounded-full
                transition-all

                ${activeIndex === index ? "w-8 bg-sky-700" : "w-2 bg-slate-300"}
              `}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default BrandVideoGallery;
