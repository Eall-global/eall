export const productFilters = ({ brands }) => [
  {
    id: "brand",
    label: "Brand",
    options: [
      {
        label: "All Brands",
        value: "All",
      },
      ...brands.map((brand) => ({
        label: brand.name,
        value: brand.slug,
      })),
    ],
  },

  {
    id: "availability",
    label: "Availability",
    options: [
      {
        label: "All",
        value: "All",
      },
      {
        label: "In Stock",
        value: "In Stock",
      },
      {
        label: "Available on Request",
        value: "Available on Request",
      },
    ],
  },

  {
    id: "sort",
    label: "Sort By",
    options: [
      {
        label: "Latest",
        value: "latest",
      },
      {
        label: "Name A-Z",
        value: "name",
      },
      {
        label: "Price Low",
        value: "price-low",
      },
      {
        label: "Price High",
        value: "price-high",
      },
    ],
  },
];
