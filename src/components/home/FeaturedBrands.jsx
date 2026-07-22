import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import { Link } from "react-router-dom";
import { brands } from "../../data/brandsData";

const FeaturedBrands = () => {
  return (
    <section className="overflow-hidden">
      <Container className="py-20 bg-gray-100!">
        <SectionTitle
          className="flex flex-col items-center text-center"
          label="Our Partners"
          title="Trusted Global Brands"
          description="We work with world-leading electronics manufacturers."
        />

        {/* MARQUEE WRAPPER */}
        <div className="mt-10 relative overflow-hidden">
          <div className="flex py-2 w-max animate-marquee gap-8">
            {/* Duplicate for seamless loop */}
            {[...brands, ...brands].map((brand, index) => (
              <Link
                key={index}
                to={`/brands/${brand.slug}`}
                className="
                  bg-white
                  rounded-xl
                  shadow-sm
                  hover:shadow-md
                  transition
                  w-40
                  h-24
                  flex
                  items-center
                  justify-center
                  shrink-0
                  p-4
                "
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="
                    max-h-10
                    w-auto
                    object-contain
                    grayscale
                    hover:grayscale-0
                    transition
                  "
                />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FeaturedBrands;
