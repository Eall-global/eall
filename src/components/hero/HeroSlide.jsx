import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const HeroSlide = ({ title, subtitle, buttonText, buttonLink, image }) => {
  return (
    <div className="relative h-[90vh] w-full">
      {/* Background Image */}
      <img
        src={image}
        alt={title}
        className="absolute inset-0 bg-center h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-end md:items-center">
        <div className=" max-w-384 mx-auto w-full px-6 lg:px-10 pb-14 md:pb-0 text-white text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl! lg:text-6xl! font-bold leading-tight max-w-2xl">
            {title}
          </h1>

          <p className="mt-4 text-base md:text-lg! lg:text-xl! max-w-sm md:max-w-xl text-slate-200">
            {subtitle}
          </p>

          <Link
            to={buttonLink}
            className="
              flex
              w-fit
              items-center
              mt-8 gap-4
              text-white
              border 
              border-white
              hover:bg-white
              hover:text-slate-900
              font-semibold
              px-6
              py-3
              rounded-3xl
              transition
            "
          >
            {buttonText}
            <span>
              <FaArrowRight />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSlide;
