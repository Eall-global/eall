import { useParams } from "react-router-dom";
import { brands } from "../../data/brandsData";
import { products } from "../../data/products/index";
import { useEffect, useState } from "react";
// import ProductListingPage from "../products/ProductListingPage";
import BrandSEO from "../../components/brands/BrandSEO";
import BrandHero from "../../components/brands/BrandHero";
import BrandStatistics from "../../components/brands/BrandStatistics";
import FeaturedProducts from "../../components/brands/FeaturedProducts";
import NewArrivals from "../../components/brands/NewArrivals";
import BrandCategories from "../../components/brands/BrandCategories";
import BrandToolbar from "../../components/brands/BrandToolbar";
import BrandProducts from "../../components/brands/BrandProducts";
import RecentlyViewedProducts from "../../components/brands/RecentlyViewedProducts";
import BrandCTA from "../../components/brands/BrandCTA";
import RelatedBrands from "../../components/brands/RelatedBrands";
import BrandVideoGallery from "../../components/brands/BrandVideoGallery";

const shuffleArray = (array) => {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

const BrandPage = () => {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(8);
  const { slug } = useParams();

  const brand = brands.find((b) => b.slug === slug);

  if (!brand) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-3xl font-bold text-red-600">Brand not found</h2>
      </div>
    );
  }

  const brandProducts = products.filter(
    (product) => product.brandSlug === slug,
  );
  // Featured Products
  const featured = shuffleArray(
    brandProducts.filter((product) => product.isFeatured),
  ).slice(0, 4);

  // New Arrivals
  const latest = shuffleArray(
    brandProducts.filter((product) => product.isNewArrival),
  ).slice(0, 4);
  // const featured = brandProducts.slice(0, 4);
  // const latest = brandProducts.slice(0, 4);

  // Recently Viewed
  const recentlyViewed =
    JSON.parse(localStorage.getItem("recentProducts")) || [];

  let filteredProducts = brandProducts.filter((product) => {
    const slugify = (value = "") => value.toLowerCase().replace(/\s+/g, "-");
    const matchesCategory =
      category === "All" ||
      slugify(product.subCategory) === category ||
      slugify(product.family) === category;

    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  let sortedProducts =
    sort === "latest" ? shuffleArray(filteredProducts) : [...filteredProducts];

  useEffect(() => {
    setVisibleCount(8);
  }, [slug, category, search, sort]);

  switch (sort) {
    case "name":
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "price-low":
      sortedProducts.sort((a, b) => a.price - b.price);
      break;

    case "price-high":
      sortedProducts.sort((a, b) => b.price - a.price);
      break;

    default:
      break;
  }

  const breadcrumbs = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Brands",
      href: "/brands",
    },
    {
      label: brand.name,
    },
  ];

  return (
    <>
      <BrandSEO brand={brand} />

      <BrandHero brand={brand} />

      {/* <BrandStatistics brand={brand} /> */}

      {/* <ProductListingPage
        title={brand.name}
        description={`Browse our complete range of ${brand.name} products.`}
        products={brandProducts}
        breadcrumbs={breadcrumbs}
      /> */}

      <FeaturedProducts products={featured} />

      <NewArrivals products={latest} />

      {brand.videos?.length > 0 && <BrandVideoGallery videos={brand.videos} />}

      <div className="text-left bg-white py-4 px-6 lg:px-10 lg:py-6">
        <h2 className="text-3xl font-bold text-slate-900!">Explore Products</h2>

        <p className="text-slate-500 mt-2!">
          Browse the complete range of {brand.name} products available through
          E-ALL.
        </p>
      </div>
      <div className=" bg-white flex flex-col-reverse lg:flex-row lg:items-center lg:justify-between ">
        <div className="w-full lg:flex-1 min-w-0">
          <BrandCategories
            categories={brand.categories}
            selectedCategory={category}
            onSelect={setCategory}
          />
        </div>

        <div className="w-full lg:w-auto shrink-0">
          <BrandToolbar
            search={search}
            onSearch={setSearch}
            sort={sort}
            onSort={setSort}
          />
        </div>
      </div>

      <BrandProducts
        total={filteredProducts.length}
        products={sortedProducts.slice(0, visibleCount)}
      />

      {visibleCount < sortedProducts.length && (
        <div className="text-center bg-white py-10">
          <button
            onClick={() => setVisibleCount((prev) => prev + 8)}
            className="
                    bg-sky-700
                    hover:bg-sky-800
                    text-white
                    px-8
                    py-3
                    rounded-xl
                    transition
                "
          >
            View More Products
          </button>
        </div>
      )}

      <RelatedBrands brands={brands} current={brand} />

      <RecentlyViewedProducts products={recentlyViewed} />

      <BrandCTA brand={brand} />
    </>
  );
};

export default BrandPage;
