import HeroCarousel from "../components/hero/HeroCarousel";

import CompanyIntro from "../components/home/CompanyIntro";
import FeaturedBrands from "../components/home/FeaturedBrands";
import ProductCategories from "../components/home/ProductCategories";
import WhyChooseUs from "../components/home/WhyChooseUs";
import FeaturedProducts from "../components/home/FeaturedProducts";
import Services from "../components/home/Services";
import Testimonials from "../components/home/Testimonials";
import NewsSection from "../components/home/NewsSection";
import ContactForm from "../components/home/ContactForm";
import ContactUs from "../components/home/ContactUs";
import DistributionCategories from "../components/home/DistributionCategories";

const Home = () => {
  return (
    <>
      {/* HERO */}
      <HeroCarousel />

      {/* HOMEPAGE SECTIONS */}
      {/* <CompanyIntro /> */}
      <FeaturedBrands />
      {/* <ProductCategories /> */}
      <DistributionCategories />
      <WhyChooseUs />
      <FeaturedProducts />
      <Testimonials />
      {/* <Services /> */}
      <NewsSection />
      {/* <ContactForm /> */}
      <ContactUs />
    </>
  );
};

export default Home;
