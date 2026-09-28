// Apple iPhone 18 catalogue
// Image paths match the included "Iphone 18" media directory exactly.
//
// Place the media folder in:
// public/GALLERY/Iphone 18/

const GALLERY_BASE = "/GALLERY/Iphone 18";

export const iphone18Products = [
  {
    id: "apple-iphone-18-pro",
    sku: "APPLE-IP18-PRO",
    slug: "iphone-18-pro",
    name: "Apple iPhone 18 Pro",
    shortName: "iPhone 18 Pro",

    brand: "Apple",
    brandSlug: "apple",

    image: `${GALLERY_BASE}/Iphone 18 pro/black/iPhone-18-Pro-Black-Front-And-Back-Design.png`,
    gallery: [
      `${GALLERY_BASE}/Iphone 18 pro/black/iPhone-18-Pro-Black-Front-And-Back-Design.png`,
      `${GALLERY_BASE}/Iphone 18 pro/black/iphone-18-pro-finish-select-202609-6-3inch-black_AV1.webp`,
      `${GALLERY_BASE}/Iphone 18 pro/black/iphone-18-pro-finish-select-202609-6-3inch-black_AV2.webp`,
    ],

    category: "mobile-devices",
    categoryName: "Mobile Devices",
    subCategory: "Smartphones",
    familyName: "Flagship Smartphones",
    family: "flagship-smartphones",

    series: "iPhone 18",
    model: "18 Pro",

    colorOptions: ["Black", "Burgundy", "Glacier", "Silver"],

    variants: [
      {
        color: "Black",
        colorSlug: "black",
        sku: "APPLE-IP18-PRO-BLACK",
        image: `${GALLERY_BASE}/Iphone 18 pro/black/iPhone-18-Pro-Black-Front-And-Back-Design.png`,
        gallery: [
          `${GALLERY_BASE}/Iphone 18 pro/black/iPhone-18-Pro-Black-Front-And-Back-Design.png`,
          `${GALLERY_BASE}/Iphone 18 pro/black/iphone-18-pro-finish-select-202609-6-3inch-black_AV1.webp`,
          `${GALLERY_BASE}/Iphone 18 pro/black/iphone-18-pro-finish-select-202609-6-3inch-black_AV2.webp`,
        ],
      },
      {
        color: "Burgundy",
        colorSlug: "burgundy",
        sku: "APPLE-IP18-PRO-BURGUNDY",
        image: `${GALLERY_BASE}/Iphone 18 pro/burgundy/iPhone-18-Pro-Burgundy.png`,
        gallery: [
          `${GALLERY_BASE}/Iphone 18 pro/burgundy/iPhone-18-Pro-Burgundy.png`,
          `${GALLERY_BASE}/Iphone 18 pro/burgundy/iPhone-18-Pro-Burgundy-Side-And-Back-Design.png`,
          `${GALLERY_BASE}/Iphone 18 pro/burgundy/iPhone-18-Pro-Burgundy-Camera-Close-Up.png`,
        ],
      },
      {
        color: "Glacier",
        colorSlug: "glacier",
        sku: "APPLE-IP18-PRO-GLACIER",
        image: `${GALLERY_BASE}/Iphone 18 pro/glacier/iPhone-18-Pro-Blue-Front-And-Back-Design.png`,
        gallery: [
          `${GALLERY_BASE}/Iphone 18 pro/glacier/iPhone-18-Pro-Blue-Front-And-Back-Design.png`,
          `${GALLERY_BASE}/Iphone 18 pro/glacier/iphone-18-pro-finish-select-202609-6-3inch-glacier_AV1.webp`,
          `${GALLERY_BASE}/Iphone 18 pro/glacier/iPhone-18-Pro-Max-Glacier-Front-And-Rear-Product-Design.png`,
        ],
      },
      {
        color: "Silver",
        colorSlug: "silver",
        sku: "APPLE-IP18-PRO-SILVER",
        image: `${GALLERY_BASE}/Iphone 18 pro/silver/iphone-18-pro.webp`,
        gallery: [
          `${GALLERY_BASE}/Iphone 18 pro/silver/iphone-18-pro.webp`,
          `${GALLERY_BASE}/Iphone 18 pro/silver/iphone-18-pro-finish-select-202609-6-3inch-silver_AV1.webp`,
          `${GALLERY_BASE}/Iphone 18 pro/silver/iphone-18-pro-finish-select-202609-6-3inch-silver_AV2.webp`,
        ],
      },
    ],

    tags: ["5G", "OLED", "A20 Pro", "Variable Aperture", "USB-C", "Face ID", "Apple Intelligence"],

    storageOptions: ["256GB", "512GB", "1TB", "2TB"],

    // AED prices per storage tier — admin can override individual variant SKUs in Firestore
    storagePricing: {
      "256GB": 4199,
      "512GB": 4799,
      "1TB":   5499,
      "2TB":   6299,
    },

    shortDescription:
      "Apple iPhone 18 Pro — powered by the A20 Pro chip on 2nm with a 48MP variable-aperture camera and 6.3-inch Super Retina XDR display.",

    description:
      "The iPhone 18 Pro features the A20 Pro chip built on a 2-nanometer process, a groundbreaking 48MP Fusion camera with a physical variable aperture (ƒ/1.48–ƒ/4.0), 12 GB RAM, and the next-generation vapor chamber for sustained peak performance. Runs iOS 27 with Apple Intelligence.",

    specifications: {
      display: "6.3-inch Super Retina XDR OLED",
      resolution: "2622 x 1206 at 460 ppi",
      refreshRate: "ProMotion 1–120 Hz",
      brightness: "3000 nits peak (outdoor)",
      processor: "A20 Pro (2 nm)",
      ram: "12 GB LPDDR5X",
      storage: "256GB / 512GB / 1TB / 2TB",
      rearCamera: "48MP Fusion (variable ƒ/1.48–ƒ/4.0) + 48MP Ultra Wide + 48MP 4× Telephoto",
      frontCamera: "18MP TrueDepth",
      battery: "4,288 mAh (eSIM) / 4,056 mAh (physical SIM)",
      charging: "USB-C fast charge (50 % in ~20 min), MagSafe, Qi 2",
      modem: "Apple C2 cellular modem",
      connectivity: "5G (mmWave), Wi-Fi 7, Bluetooth 6, Thread",
      os: "iOS 27",
    },

    features: [
      "Variable Aperture Camera",
      "A20 Pro 2 nm Chip",
      "Vapor Chamber Cooling",
      "Apple Intelligence & Siri AI",
      "ProMotion 120 Hz Always-On Display",
      "Dynamic Island",
      "Ceramic Shield 2",
      "Face ID",
      "USB-C",
      "MagSafe",
      "Wi-Fi 7",
      "Bluetooth 6",
    ],

    availability: "Available on Request",
    warranty: "Official",

    isFeatured: true,
    isNewArrival: true,
    isTrending: true,

    createdAt: "2026-09-28",
  },

  {
    id: "apple-iphone-18-pro-max",
    sku: "APPLE-IP18-PRO-MAX",
    slug: "iphone-18-pro-max",
    name: "Apple iPhone 18 Pro Max",
    shortName: "iPhone 18 Pro Max",

    brand: "Apple",
    brandSlug: "apple",

    image: `${GALLERY_BASE}/Iphone 18 pro max/burgundy/iphone-18-pro-max-burgundy.webp`,
    gallery: [
      `${GALLERY_BASE}/Iphone 18 pro max/burgundy/iphone-18-pro-max-burgundy.webp`,
      `${GALLERY_BASE}/Iphone 18 pro max/burgundy/iphone-18-pro-finish-select-202609-6-9inch-burgundy_AV1.webp`,
      `${GALLERY_BASE}/Iphone 18 pro max/burgundy/iphone-18-pro-finish-select-202609-6-9inch-burgundy_AV2.webp`,
    ],

    category: "mobile-devices",
    categoryName: "Mobile Devices",
    subCategory: "Smartphones",
    familyName: "Flagship Smartphones",
    family: "flagship-smartphones",

    series: "iPhone 18",
    model: "18 Pro Max",

    colorOptions: ["Black", "Burgundy", "Glacier", "Silver"],

    variants: [
      {
        color: "Burgundy",
        colorSlug: "burgundy",
        sku: "APPLE-IP18-PRO-MAX-BURGUNDY",
        image: `${GALLERY_BASE}/Iphone 18 pro max/burgundy/iphone-18-pro-max-burgundy.webp`,
        gallery: [
          `${GALLERY_BASE}/Iphone 18 pro max/burgundy/iphone-18-pro-max-burgundy.webp`,
          `${GALLERY_BASE}/Iphone 18 pro max/burgundy/iphone-18-pro-finish-select-202609-6-9inch-burgundy_AV1.webp`,
          `${GALLERY_BASE}/Iphone 18 pro max/burgundy/iphone-18-pro-finish-select-202609-6-9inch-burgundy_AV2.webp`,
        ],
      },
      {
        color: "Black",
        colorSlug: "black",
        sku: "APPLE-IP18-PRO-MAX-BLACK",
        image: `${GALLERY_BASE}/Iphone 18 pro max/black/iPhone-18-Pro-Black-Front-And-Back-Design.png`,
        gallery: [
          `${GALLERY_BASE}/Iphone 18 pro max/black/iPhone-18-Pro-Black-Front-And-Back-Design.png`,
          `${GALLERY_BASE}/Iphone 18 pro max/black/iphone-18-pro-finish-select-202609-6-9inch-black_AV1.webp`,
          `${GALLERY_BASE}/Iphone 18 pro max/black/iphone-18-pro-finish-select-202609-6-9inch-black_AV2.webp`,
        ],
      },
      {
        color: "Glacier",
        colorSlug: "glacier",
        sku: "APPLE-IP18-PRO-MAX-GLACIER",
        image: `${GALLERY_BASE}/Iphone 18 pro max/glacier/iphone-18-pro-finish-select-202609-6-9inch-glacier.webp`,
        gallery: [
          `${GALLERY_BASE}/Iphone 18 pro max/glacier/iphone-18-pro-finish-select-202609-6-9inch-glacier.webp`,
          `${GALLERY_BASE}/Iphone 18 pro max/glacier/iphone-18-pro-finish-select-202609-6-9inch-glacier_AV1.webp`,
          `${GALLERY_BASE}/Iphone 18 pro max/glacier/iphone-18-pro-finish-select-202609-6-9inch-glacier_AV2.webp`,
        ],
      },
      {
        color: "Silver",
        colorSlug: "silver",
        sku: "APPLE-IP18-PRO-MAX-SILVER",
        image: `${GALLERY_BASE}/Iphone 18 pro max/silver/iphone-18-pro-finish-select-202609-6-9inch-silver.webp`,
        gallery: [
          `${GALLERY_BASE}/Iphone 18 pro max/silver/iphone-18-pro-finish-select-202609-6-9inch-silver.webp`,
          `${GALLERY_BASE}/Iphone 18 pro max/silver/iphone-18-pro-finish-select-202609-6-9inch-silver_AV1.webp`,
          `${GALLERY_BASE}/Iphone 18 pro max/silver/iphone-18-pro-finish-select-202609-6-9inch-silver_AV2.webp`,
        ],
      },
    ],

    tags: ["5G", "OLED", "A20 Pro", "Variable Aperture", "USB-C", "Face ID", "Apple Intelligence"],

    storageOptions: ["256GB", "512GB", "1TB", "2TB"],

    // AED prices per storage tier — admin can override individual variant SKUs in Firestore
    storagePricing: {
      "256GB": 4599,
      "512GB": 5199,
      "1TB":   5999,
      "2TB":   6799,
    },

    shortDescription:
      "Apple iPhone 18 Pro Max — the largest iPhone with A20 Pro chip, 48MP variable-aperture camera and 6.9-inch Super Retina XDR display.",

    description:
      "The iPhone 18 Pro Max delivers the ultimate Apple smartphone experience with a 6.9-inch Super Retina XDR display, A20 Pro chip on 2 nm, 12 GB RAM, a 48MP Fusion camera with physical variable aperture (ƒ/1.48–ƒ/4.0), and a massive 5,567 mAh battery. Runs iOS 27 with Apple Intelligence.",

    specifications: {
      display: "6.9-inch Super Retina XDR OLED",
      resolution: "2868 x 1320 at 460 ppi",
      refreshRate: "ProMotion 1–120 Hz",
      brightness: "3000 nits peak (outdoor)",
      processor: "A20 Pro (2 nm)",
      ram: "12 GB LPDDR5X",
      storage: "256GB / 512GB / 1TB / 2TB",
      rearCamera: "48MP Fusion (variable ƒ/1.48–ƒ/4.0) + 48MP Ultra Wide + 48MP 4× Telephoto",
      frontCamera: "18MP TrueDepth",
      battery: "5,567 mAh (eSIM) / 5,391 mAh (physical SIM)",
      charging: "USB-C fast charge (50 % in ~20 min), MagSafe, Qi 2",
      modem: "Apple C2 cellular modem",
      connectivity: "5G (mmWave), Wi-Fi 7, Bluetooth 6, Thread",
      os: "iOS 27",
    },

    features: [
      "Variable Aperture Camera",
      "A20 Pro 2 nm Chip",
      "Vapor Chamber Cooling",
      "Apple Intelligence & Siri AI",
      "ProMotion 120 Hz Always-On Display",
      "Dynamic Island",
      "Ceramic Shield 2",
      "Face ID",
      "USB-C",
      "MagSafe",
      "Wi-Fi 7",
      "Bluetooth 6",
    ],

    availability: "Available on Request",
    warranty: "Official",

    isFeatured: true,
    isNewArrival: true,
    isTrending: true,

    createdAt: "2026-09-28",
  },
];

export const appleProducts = [
  ...iphone18Products,
  {
    id: 1,

    sku: "APL-IP16P-256-BLK",

    slug: "iphone-16-pro",

    name: "iPhone 16 Pro",

    shortName: "iPhone 16 Pro",

    brand: "Apple",

    brandSlug: "apple",

    image: "/products/apple/iphone-16pro.png",

    gallery: [
      "/products/apple/iphone-16pro.png",
      "/products/apple/iphone16pro-2.png",
      "/products/apple/iphone16pro-3.png",
    ],

    category: "mobile-devices",

    categoryName: "Mobile Devices",

    subCategory: "Smartphones",

    familyName: "Flagship Smartphones",

    family: "flagship-smartphones",

    series: "iPhone",

    model: "16 Pro",

    tags: ["5G", "OLED", "A18 Pro", "Face ID", "USB-C", "Titanium"],

    storageOptions: ["128GB", "256GB", "512GB", "1TB"],

    // AED prices per storage tier
    storagePricing: {
      "128GB": 3199,
      "256GB": 3499,
      "512GB": 3999,
      "1TB":   4599,
    },

    shortDescription: "Apple iPhone 16 Pro — A18 Pro chip, 48MP Fusion camera, 6.3-inch Super Retina XDR display.",

    description:
      "The iPhone 16 Pro delivers premium performance with the A18 Pro chip, a 48MP triple-camera system with 5× optical zoom, a 6.3-inch ProMotion OLED display, and grade-5 titanium design. Features Apple Intelligence and runs iOS 18.",

    specifications: {
      display: "6.3-inch Super Retina XDR OLED",
      resolution: "2622 x 1206 at 460 ppi",
      refreshRate: "ProMotion 1–120 Hz",
      brightness: "2000 nits peak (outdoor)",
      processor: "A18 Pro",
      ram: "8 GB",
      storage: "128GB / 256GB / 512GB / 1TB",
      rearCamera: "48MP Fusion (ƒ/1.78) + 48MP Ultra Wide (ƒ/2.2) + 12MP 5× Telephoto (ƒ/2.8)",
      frontCamera: "12MP TrueDepth",
      battery: "3,582 mAh",
      charging: "USB-C fast charge (50 % in ~30 min), MagSafe, Qi 2",
      connectivity: "5G, Wi-Fi 7, Bluetooth 5.3",
      os: "iOS 18",
    },

    features: [
      "48MP Triple Camera",
      "Grade-5 Titanium Frame",
      "USB-C",
      "Face ID",
      "ProMotion 120 Hz Always-On Display",
      "Dynamic Island",
      "Ceramic Shield Front",
      "Camera Control Button",
      "Action Button",
      "MagSafe",
    ],

    availability: "In Stock",
    warranty: "Official",
    isFeatured: false,
    isNewArrival: false,
    isTrending: false,

    createdAt: "2026-05-18",
  },

  {
    id: 2,

    sku: "APL-IP17PM-256-ORN",

    slug: "iphone-17-pro-max",

    name: "iPhone 17 Pro Max",

    shortName: "iPhone 16 Pro Max",

    brand: "Apple",

    brandSlug: "apple",

    image: "/products/apple/iPhone-17-Pro-Max.png",

    gallery: [
      "/products/apple/iPhone-17-Pro-Max.png",
      "/products/apple/iphone-17-pro-backSide.webp",
      "/products/apple/iphone-17-pro-side.webp",
      "/products/apple/iphone-17-pro.webp",
    ],

    category: "mobile-devices",

    categoryName: "Mobile Devices",

    subCategory: "Smartphones",

    familyName: "Flagship Smartphones",

    family: "flagship-smartphones",

    series: "iPhone",

    model: "17 Pro Max",

    tags: ["5G", "OLED", "A19 Pro", "Face ID", "USB-C", "Titanium"],

    storageOptions: ["256GB", "512GB", "1TB"],

    // AED prices per storage tier
    storagePricing: {
      "256GB": 3999,
      "512GB": 4499,
      "1TB":   5199,
    },

    shortDescription: "Apple iPhone 17 Pro Max — A19 Pro chip, 48MP Pro Fusion camera, 6.9-inch Super Retina XDR display.",

    description:
      "The iPhone 17 Pro Max features the A19 Pro chip, a 6.9-inch ProMotion OLED display with 3,000-nit peak brightness, a 48MP triple-camera system with 4× optical zoom, 12 GB RAM, Ceramic Shield 2, and all-day battery life. Runs iOS 26 with Apple Intelligence.",

    specifications: {
      display: "6.9-inch Super Retina XDR OLED",
      resolution: "2868 x 1320 at 460 ppi",
      refreshRate: "ProMotion 1–120 Hz",
      brightness: "3000 nits peak (outdoor)",
      processor: "A19 Pro",
      ram: "12 GB LPDDR5X",
      storage: "256GB / 512GB / 1TB",
      rearCamera: "48MP Fusion (ƒ/1.78) + 48MP Ultra Wide (ƒ/2.2) + 48MP 4× Telephoto",
      frontCamera: "18MP Center Stage",
      battery: "~5,088 mAh (eSIM) / ~4,823 mAh (physical SIM)",
      charging: "USB-C fast charge (50 % in ~20 min), MagSafe, Qi 2",
      connectivity: "5G, Wi-Fi 7, Bluetooth 5.3",
      os: "iOS 26",
    },

    features: [
      "48MP Triple Camera with 4× Zoom",
      "A19 Pro Chip",
      "Grade-5 Titanium Frame",
      "Ceramic Shield 2",
      "USB-C",
      "Face ID",
      "ProMotion 120 Hz Always-On Display",
      "Dynamic Island",
      "Apple Intelligence",
      "Action Button",
      "Camera Control",
      "MagSafe",
    ],

    availability: "In Stock",
    warranty: "Official",
    isFeatured: false,
    isNewArrival: false,
    isTrending: false,

    createdAt: "2026-05-18",
  },
  {
    id: 3,
    sku: "APL-APPRO3",

    slug: "airpods-pro-3",

    name: "AirPods Pro 3",

    shortName: "Airpods Pro",

    brand: "Apple",

    brandSlug: "apple",

    gallery: [
      "/products/apple/airpods-pro-3-gallery-3.jpg",
      "/products/apple/airpods-pro-3-gallery-1.jpg",
      "/products/apple/airpods-pro-3-hero.jpg",
    ],

    category: "consumer-electronics",

    categoryName: "Consumer Electronics",

    subCategory: "Audio",

    family: "earbuds",

    familyName: "Earbuds",

    series: "airpods",

    model: "Pro 3",

    image: "/products/apple/airpods-pro-3-hero.jpg",

    tags: ["AirPods", "ANC", "Apple H2", "Hearing Health", "Spatial Audio"],

    shortDescription:
      "AirPods Pro 3 — powered by the H2 chip with 2× better ANC, heart-rate sensor, and up to 8 hrs listening.",

    description:
      "The AirPods Pro 3 feature the Apple H2 chip, advanced Active Noise Cancellation that removes up to 2× more noise, Adaptive Audio, a built-in heart-rate sensor, Hearing Health suite (Hearing Test, Hearing Aid, Hearing Protection), and IP57 dust/water resistance.",

    specifications: {
      chip: "Apple H2",
      driver: "Custom high-excursion Apple driver",
      anc: "Active Noise Cancellation (2× improvement)",
      batteryEarbuds: "Up to 8 hrs (ANC on)",
      batteryTotal: "Up to 24 hrs with case",
      connectivity: "Bluetooth 5.3",
      resistance: "IP57 (dust, sweat, water)",
      earTips: "Foam-infused silicone (XXS, XS, S, M, L)",
      charging: "USB-C, MagSafe, Qi",
    },

    features: [
      "Active Noise Cancellation",
      "Adaptive Audio",
      "Transparency Mode",
      "Conversation Awareness",
      "Heart Rate Sensor",
      "Hearing Health (Test, Aid, Protection)",
      "Personalized Spatial Audio",
      "Live Translation",
      "IP57 Dust & Water Resistant",
      "Precision Finding (U2 chip in case)",
    ],

    availability: "In Stock",
    warranty: "Official",
    isFeatured: true,
    isNewArrival: true,
    isTrending: true,

    createdAt: "2026-05-18",
  },
  {
    id: 4,
    sku: "APL-APPRO-4",

    slug: "airpods-pro-4",

    name: "AirPods Pro 4",

    shortName: "Airpods Pro",

    brand: "Apple",

    brandSlug: "apple",

    gallery: [
      "/products/apple/airpods-4.jpg",
      "/products/apple/airpods-4-in.jpg",
      "/products/apple/airpods-4-gallery-3.jpg",
    ],

    category: "consumer-electronics",

    categoryName: "Consumer Electronics",

    subCategory: "Audio",

    family: "earbuds",

    familyName: "Earbuds",

    series: "airpods",

    model: "4 ANC",

    image: "/products/apple/airpods-4.jpg",

    tags: ["AirPods", "ANC", "Apple H2", "Spatial Audio", "Open-Ear"],

    shortDescription:
      "AirPods 4 with Active Noise Cancellation — H2 chip, open-ear comfort, Adaptive Audio, and up to 30 hrs total battery.",

    description:
      "The AirPods 4 with ANC combine the open-ear design with the H2 chip, Active Noise Cancellation, Adaptive Audio, Transparency mode, Conversation Awareness, Personalized Spatial Audio, and IP54 dust/water resistance. USB-C case supports wireless charging.",

    specifications: {
      chip: "Apple H2",
      driver: "Custom high-excursion Apple driver",
      anc: "Active Noise Cancellation",
      batteryEarbuds: "Up to 4 hrs (ANC on) / 5 hrs (ANC off)",
      batteryTotal: "Up to 30 hrs with case",
      connectivity: "Bluetooth 5.3",
      resistance: "IP54 (dust, sweat, water)",
      weight: "4.3 g per earbud",
      charging: "USB-C, Apple Watch charger, Qi",
    },

    features: [
      "Active Noise Cancellation",
      "Adaptive Audio",
      "Transparency Mode",
      "Conversation Awareness",
      "Personalized Spatial Audio",
      "Voice Isolation",
      "Adaptive EQ",
      "IP54 Dust & Water Resistant",
      "Find My with Speaker",
      "Open-Ear Design",
    ],

    availability: "In Stock",
    warranty: "Official",
    isFeatured: true,
    isNewArrival: true,
    isTrending: true,

    createdAt: "2026-05-18",
  },
];

export default appleProducts;
