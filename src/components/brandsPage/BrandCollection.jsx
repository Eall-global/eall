import { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";

import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";

import BrandGrid from "./BrandGrid";

const INITIAL_COUNT = 6;

const BrandCollection = ({ brands }) => {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");

  const filteredBrands = brands.filter((brand) => {
    const keyword = search.toLowerCase();

    return (
      brand.name.toLowerCase().includes(keyword) ||
      brand.description.toLowerCase().includes(keyword)
    );
  });

  useEffect(() => {
    setShowAll(false);
  }, [search]);

  const displayedBrands = showAll
    ? filteredBrands
    : filteredBrands.slice(0, INITIAL_COUNT);

  return (
    <section className="bg-white p-6 lg:p-10">
      <SectionTitle
        className=" flex flex-col items-center text-center"
        label="Global Technology Brands"
        title="Explore Our Brand Portfolio"
        description="Browse internationally trusted manufacturers distributed through E-ALL."
      />

      <div className=" max-w-xl mx-auto relative">
        <FiSearch className=" absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands, manufacturers..."
          className="w-full rounded-full border border-slate-200 bg-white py-4 pl-12 pr-6 outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100 transition"
        />
      </div>

      <div className="mt-8 text-center text-sm text-slate-500">
        {filteredBrands.length === 0 ? (
          <>
            No brands found
            {search && <span className="font-medium"> for "{search}"</span>}
          </>
        ) : (
          <>
            Showing{" "}
            <span className="font-semibold text-sky-700">
              {displayedBrands.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-sky-700">
              {filteredBrands.length}
            </span>{" "}
            brands
          </>
        )}
      </div>

      {filteredBrands.length === 0 ? (
        <div className="py-20 text-center">
          <h3 className="text-2xl font-semibold text-slate-900">
            Brand Not Found
          </h3>

          <p className="mt-4 text-slate-500">
            We couldn't find a matching brand.
          </p>

          <button
            onClick={() => setSearch("")}
            className="mt-8 rounded-full bg-sky-700 px-6 py-3 text-white transition hover:bg-sky-800"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <>
          <BrandGrid brands={displayedBrands} />

          {filteredBrands.length > INITIAL_COUNT && (
            <div className="mt-14 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="rounded-full border border-slate-300 px-7 py-3 font-medium transition hover:border-sky-700 hover:text-sky-700"
              >
                {showAll
                  ? "Show Less"
                  : `View ${brands.length - INITIAL_COUNT} More Brands`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default BrandCollection;
