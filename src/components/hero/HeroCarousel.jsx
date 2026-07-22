import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import HeroSlide from "./HeroSlide";
import { heroSlides } from "../../data/heroSlides";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const HeroCarousel = () => {
  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        effect="fade"
        navigation={{
          prevEl: ".hero-prev",
          nextEl: ".hero-next",
        }}
        pagination={{ clickable: true }}
        className="h-[90vh]"
      >
        {heroSlides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <HeroSlide {...slide} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Buttons */}
      <button className="hero-prev absolute left-5 top-1/2 z-10 text-white text-3xl">
        <FiChevronLeft />
      </button>

      <button className="hero-next absolute right-5 top-1/2 z-10 text-white text-3xl">
        <FiChevronRight />
      </button>

      {/* Slide Indicator (optional UI layer later) */}
      <div className="absolute bottom-6 right-10 text-white text-sm z-10">
        E-ALL • Electronics All
      </div>
    </div>
  );
};

export default HeroCarousel;
