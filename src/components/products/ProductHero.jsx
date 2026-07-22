import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import SlideUp from "../animations/SlideUp";

const ProductHero = ({ totalProducts, totalBrands, totalCategories }) => {
  return (
    <section className="bg-linear-to-b from-sky-50 to-white">
      <Container className="py-16 lg:py-24">
        <SlideUp>
          <SectionTitle
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
            label="PRODUCT CATALOGUE"
            title="Discover Technology Products For Every Business"
            description="Browse smartphones, enterprise IT solutions, consumer electronics, networking equipment, and accessories from globally trusted technology brands."
          />
        </SlideUp>

        <SlideUp delay={0.15}>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
              <h3 className="text-4xl font-bold text-sky-700">
                {totalProducts}+
              </h3>

              <p className="mt-2 text-sm text-slate-500">Products Available</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
              <h3 className="text-4xl font-bold text-sky-700">{totalBrands}</h3>

              <p className="mt-2 text-sm text-slate-500">Global Brands</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
              <h3 className="text-4xl font-bold text-sky-700">
                {totalCategories}
              </h3>

              <p className="mt-2 text-sm text-slate-500">Product Categories</p>
            </div>
          </div>
        </SlideUp>
      </Container>
    </section>
  );
};

export default ProductHero;
