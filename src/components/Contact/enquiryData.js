import { FiPackage, FiSmartphone } from "react-icons/fi";

import { FaSearch, FaRegQuestionCircle } from "react-icons/fa";

import { LuHandshake } from "react-icons/lu";

export const enquiryOptions = [
  {
    id: "bulk",
    title: "Bulk Orders",
    icon: FiPackage,

    message:
      "I am interested in bulk purchasing electronics. Please share available products, MOQ, pricing and wholesale terms.",
    categories: [
      "Smartphones",
      "Accessories",
      "Consumer Electronics",
      "IT Products",
    ],
  },

  {
    id: "availability",
    title: "Product Availability",
    icon: FaSearch,

    message:
      "I would like to check availability and pricing for specific products.",
    categories: [
      "Smartphones",
      "Accessories",
      "Smart Watches",
      "Other Electronics",
    ],
  },

  {
    id: "stock",
    title: "Stock Availability",
    icon: FiSmartphone,

    message:
      "I would like to know your current stock availability and ready-to-ship products.",
    categories: ["Smartphones", "Accessories", "Latest Products"],
  },

  {
    id: "partnership",
    title: "Partnership",
    icon: LuHandshake,

    message:
      "I am interested in becoming a business partner with E-ALL. Please share partnership opportunities.",
    categories: [
      "Retail Partnership",
      "Wholesale Partnership",
      "Distribution Partnership",
    ],
  },

  {
    id: "general",
    title: "General Enquiry",
    icon: FaRegQuestionCircle,

    message:
      "I have a general enquiry and would like assistance from your team.",
    categories: ["General"],
  },
];
