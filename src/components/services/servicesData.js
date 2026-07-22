import {
  FiSmartphone,
  FiHeadphones,
  FiShoppingBag,
  FiBriefcase,
  FiGlobe,
  FiTruck,
} from "react-icons/fi";

export const servicesHero = {
  title: "Technology Distribution & Supply Solutions",

  subtitle:
    "Reliable sourcing, wholesale distribution, and global technology supply.",

  description:
    "Electronics All (E-ALL) provides end-to-end technology distribution solutions backed by over 15 years of industry expertise through Fast Track Global General Trading LLC.",

  image: "/services/hero.png",
};

export const services = [
  {
    title: "Smartphone Distribution",
    icon: <FiSmartphone />,
    badge: "Distribution",
    link: "/products",

    description:
      "Wholesale supply of Apple, Samsung, Xiaomi, Honor, Oppo, Realme, Huawei, and other globally recognized smartphone brands.",
  },

  {
    title: "Consumer Electronics",
    icon: <FiHeadphones />,
    badge: "Electronics",
    link: "/products",

    description:
      "Earbuds, smartwatches, tablets, gaming accessories, wearables, speakers, chargers, and premium electronic accessories.",
  },

  {
    title: "Wholesale Supply",
    icon: <FiShoppingBag />,
    badge: "B2B",

    link: "/contact",

    description:
      "Reliable supply solutions tailored for retailers, resellers, distributors, and online marketplaces worldwide.",
  },

  {
    title: "Corporate Procurement",
    icon: <FiBriefcase />,
    badge: "Enterprise",

    link: "/contact",

    description:
      "Customized procurement solutions for businesses, educational institutions, government agencies, and corporate organizations.",
  },

  {
    title: "International Export",
    icon: <FiGlobe />,
    badge: "Global",

    link: "/contact",

    description:
      "Export services across Africa, the GCC, the Middle East, and international markets through an efficient global network.",
  },

  {
    title: "Supply Chain Solutions",
    icon: <FiTruck />,
    badge: "Logistics",

    link: "/services",

    description:
      "Warehousing, inventory management, packaging, shipping, customs coordination, and end-to-end logistics support.",
  },
];
