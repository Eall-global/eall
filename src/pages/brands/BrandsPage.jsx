import { Link } from "react-router-dom";

import Container from "../../components/common/Container";
import SectionTitle from "../../components/common/SectionTitle";

import { brands } from "../../data/brandsData";
import BrandPageHero from "../../components/brandsPage/BrandPageHero";
// import FeaturedBrands from "../../components/brands/FeaturedBrands";
// import BrandGrid from "../../components/brandsPage/BrandGrid";
import { products } from "../../data/products/index";
import { useEffect, useRef, useState } from "react";
import WhyChooseBrands from "../../components/brandsPage/WhyChooseBrands";
import BrandsPageCTA from "../../components/brandsPage/BrandsPageCTA";
import BrandCollection from "../../components/brandsPage/BrandCollection";

const BrandsPage = () => {
  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");

  const [country, setCountry] = useState("All");

  const [sort, setSort] = useState("latest");

  const collectionRef = useRef(null);

  /*
Dynamic filters
*/

  const categories = [
    ...new Set(brands.flatMap((brand) => brand.categories || [])),
  ];

  const countries = [...new Set(brands.map((brand) => brand.country))];

  let filteredBrands = brands.filter((brand) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      brand.name.toLowerCase().includes(keyword) ||
      brand.description.toLowerCase().includes(keyword);

    const matchesCategory =
      category === "All" || brand.categories?.includes(category);

    const matchesCountry = country === "All" || brand.country === country;

    return matchesSearch && matchesCategory && matchesCountry;
  });

  /*
Sorting
*/

  if (sort === "name") {
    filteredBrands.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sort === "products") {
    filteredBrands.sort(
      (a, b) => (b.stats?.products || 0) - (a.stats?.products || 0),
    );
  }

  const featuredBrands = brands.filter((brand) => brand.featured);

  const clearFilters = () => {
    setSearch("");

    setCategory("All");

    setCountry("All");

    setSort("latest");
  };

  return (
    <section className="min-h-fit bg-white">
      <div className=" py-10">
        <BrandPageHero
          totalBrands={brands.length}
          totalProducts={products.length}
          search={search}
          onSearch={setSearch}
        />
      </div>

      <BrandCollection brands={brands} />

      {/* 
      {filteredBrands.length > INITIAL_BRANDS && (
        <button onClick={() => setShowAll(!showAll)}>
          {showAll
            ? "Show Less"
            : `View ${filteredBrands.length - INITIAL_BRANDS} More Brands`}
        </button>
      )} */}

      <WhyChooseBrands />

      <BrandsPageCTA />
    </section>
  );
};

export default BrandsPage;
