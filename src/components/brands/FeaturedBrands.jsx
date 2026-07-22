import SectionTitle from "../common/SectionTitle";
import BrandCard from "./BrandCard";

const FeaturedBrands = ({ brands }) => {
  return (
    <section
      className="
py-16
bg-white
"
    >
      <div
        className="
px-6
lg:px-10
"
      >
        <SectionTitle
          className=" flex flex-col items-center text-center"
          label="FEATURED PARTNERS"
          title="Leading Technology Brands"
          description="
Explore products from globally recognized manufacturers trusted by businesses worldwide.
"
        />

        <div
          className="
mt-12
grid
md:grid-cols-2
xl:grid-cols-3
gap-8
"
        >
          {brands.map((brand) => (
            <BrandCard key={brand.slug} brand={brand} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBrands;
