import {
  FiShoppingBag,
  FiTruck,
  FiMonitor,
  FiBookOpen,
  FiGlobe,
  FiHome,
} from "react-icons/fi";

export const industries = [
  {
    id: 1,
    title: "Retail Stores",
    icon: FiShoppingBag,
    image: "/images/industries/retail.jpg",
    challenge:
      "Retailers need genuine products, competitive pricing, and consistent inventory to satisfy customer demand.",
    solution:
      "E-ALL supplies authentic smartphones, accessories, and consumer electronics with flexible order quantities and dependable replenishment.",
    products: ["Smartphones", "Accessories", "Smart Watches", "Audio Products"],
  },

  {
    id: 2,
    title: "Wholesale Distributors",
    icon: FiTruck,
    image: "/images/industries/wholesale.jpg",
    challenge:
      "Distributors require scalable procurement, stable pricing, and reliable international supply chains.",
    solution:
      "Our wholesale program supports bulk sourcing, export documentation, and global logistics coordination.",
    products: [
      "Bulk Device Supply",
      "Consumer Electronics",
      "Accessories",
      "Networking Equipment",
    ],
  },

  {
    id: 3,
    title: "Corporate & Enterprise",
    icon: FiMonitor,
    image: "/images/industries/corporate.jpg",
    challenge:
      "Organizations require standardized procurement, warranty assurance, and dedicated account support.",
    solution:
      "We provide customized procurement solutions for companies, institutions, and enterprise projects.",
    products: ["Laptops", "Tablets", "Enterprise Devices", "Office Technology"],
  },

  {
    id: 4,
    title: "Education",
    icon: FiBookOpen,
    image: "/images/industries/education.jpg",
    challenge:
      "Educational institutions need affordable, durable devices that support modern learning environments.",
    solution:
      "E-ALL delivers classroom-ready technology packages with scalable procurement options.",
    products: ["Chromebooks", "Tablets", "Projectors", "Accessories"],
  },

  {
    id: 5,
    title: "International Buyers",
    icon: FiGlobe,
    image: "/images/industries/export.jpg",
    challenge:
      "International customers need trusted export partners with efficient logistics and documentation.",
    solution:
      "From sourcing to customs documentation, E-ALL simplifies cross-border procurement.",
    products: [
      "Export Orders",
      "Bulk Electronics",
      "Mixed Containers",
      "OEM Requests",
    ],
  },

  {
    id: 6,
    title: "E-Commerce Sellers",
    icon: FiHome,
    image: "/images/industries/ecommerce.jpg",
    challenge:
      "Online sellers require flexible purchasing, fast replenishment, and reliable product authenticity.",
    solution:
      "We support online retailers with inventory solutions that enable sustainable growth.",
    products: [
      "Marketplace Stock",
      "Fast-Moving Items",
      "Accessories",
      "Seasonal Products",
    ],
  },
];
