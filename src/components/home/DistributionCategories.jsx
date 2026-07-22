import React from "react";
import SectionTitle from "../common/SectionTitle";
import Container from "../common/Container";
import { Link } from "react-router-dom";
import categories from "../../data/categories";

const DistributionCategories = () => {
  return (
    <section className="py-20 bg-white">
      <Container>
        <SectionTitle
          className="text-left"
          label="What We Supply"
          title="Distribution categories"
          description="Comprehensive technology distribution spanning six core verticals, serving businesses across the region."
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.slug}
                to={`/products?category=${category.slug}`}
                className="group relative p-8 rounded-2xl bg-[#F8F9FA] hover:bg-white hover:shadow-xl hover:shadow-black/5 border border-transparent hover:border-gray-100 transition-all duration-500 cursor-default"
                style={{ opacity: 1, transform: "none" }}
              >
                <span className="text-6xl font-bold text-gray-100 group-hover:text-[#0047D5]/20 transition-colors duration-500 absolute top-6 right-8 cursor-pointer">
                  {String(category.id).padStart(2, "0")}
                </span>
                <div className="relative z-10 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#0047D5]/10 flex items-center justify-center mb-5">
                    <Icon className="text-xl text-sky-700 font-bold" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="mt-2! text-sm text-gray-500 leading-relaxed">
                    {category.description}
                  </p>
                  <span className="mt-6 inline-flex text-sky-700 font-semibold items-center">
                    Explore →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default DistributionCategories;
