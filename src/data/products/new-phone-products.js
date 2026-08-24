// HMD / Nokia phone catalogue
// Gallery paths match the included hmd_phones_colors media directory.
//
// Place the media folder in:
// public/GALLERY/hmd_phones_colors/
//
// Then this file can reference images from:
// /GALLERY/hmd_phones_colors/<model>/<color>/<filename>

const GALLERY_BASE = "/GALLERY/hmd_phones_colors";

const newPhoneProducts = [
  {
    id: "hmd-100",
    sku: "HMD-100",
    slug: "hmd-100",
    name: "HMD 100",
    shortName: "100",

    brand: "HMD",
    brandSlug: "hmd",

    image: `${GALLERY_BASE}/100/Red/HMD_100-Red-FrontBack.avif`,
    gallery: [
      `${GALLERY_BASE}/100/Red/HMD_100-Red-FrontBack.avif`,
      `${GALLERY_BASE}/100/Red/HMD_100-Red-Front.avif`,
      `${GALLERY_BASE}/100/Red/HMD_100-Red-Back-IN.avif`,
    ],

    category: "mobile-devices",
    categoryName: "Mobile Devices",
    subCategory: "Feature Phones",
    familyName: "Classic Phones",
    family: "classic-phones",

    series: "HMD",
    model: "100",

    connectivityOptions: ["2G"],
    colorOptions: ["Red", "Grey", "Teal"],

    variants: [
      {
        color: "Red",
        colorSlug: "red",
        sku: "HMD-100-RED",
        image: `${GALLERY_BASE}/100/Red/HMD_100-Red-FrontBack.avif`,
        gallery: [
          `${GALLERY_BASE}/100/Red/HMD_100-Red-FrontBack.avif`,
          `${GALLERY_BASE}/100/Red/HMD_100-Red-Front.avif`,
          `${GALLERY_BASE}/100/Red/HMD_100-Red-Back-IN.avif`,
        ],
      },
      {
        color: "Grey",
        colorSlug: "grey",
        sku: "HMD-100-GREY",
        image: `${GALLERY_BASE}/100/Grey/HMD_100-Grey-FrontBack.avif`,
        gallery: [
          `${GALLERY_BASE}/100/Grey/HMD_100-Grey-FrontBack.avif`,
          `${GALLERY_BASE}/100/Grey/HMD_100-Grey-Front.avif`,
          `${GALLERY_BASE}/100/Grey/HMD_100-Grey-Back-IN.avif`,
        ],
      },
      {
        color: "Teal",
        colorSlug: "teal",
        sku: "HMD-100-TEAL",
        image: `${GALLERY_BASE}/100/Teal/HMD_100-Teal-FrontBack.avif`,
        gallery: [
          `${GALLERY_BASE}/100/Teal/HMD_100-Teal-FrontBack.avif`,
          `${GALLERY_BASE}/100/Teal/HMD_100-Teal-Front.avif`,
          `${GALLERY_BASE}/100/Teal/HMD_100-Teal-Back-IN.avif`,
        ],
      },
    ],

    tags: ["HMD", "100", "Feature Phones", "Classic Phones"],

    shortDescription:
      "HMD 100 feature phone focused on essential calling, texting and dependable battery life.",

    description:
      "Explore the HMD 100. Select a colour to view the matching official product gallery and key specifications.",

    specifications: {
      display: "1.77-inch QQVGA",
      processor: "Unisoc 6533G",
      memory: "4MB ROM / 4MB RAM",
      battery: "800mAh",
      connectivity: "2G, Micro-USB, 3.5mm audio jack",
      audio: "FM radio",
      operatingSystem: "S30+",
      games: "Snake",
    },

    specificationSource: "Internal HMD/Nokia portfolio document",
    availability: "Available on Request",
    warranty: "Official",
    isFeatured: true,
    isNewArrival: true,
    isTrending: true,
    createdAt: "2026-07-19",
  },

  {
    id: "hmd-101",
    sku: "HMD-101",
    slug: "hmd-101",
    name: "HMD 101",
    shortName: "101",

    brand: "HMD",
    brandSlug: "hmd",

    image: `${GALLERY_BASE}/101/Grey/HMD_101-Grey-FrontBack-Int.avif`,
    gallery: [
      `${GALLERY_BASE}/101/Grey/HMD_101-Grey-FrontBack-Int.avif`,
      `${GALLERY_BASE}/101/Grey/HMD_101-Grey-Front-Int.avif`,
      `${GALLERY_BASE}/101/Grey/HMD_101-Grey-Back-Int.avif`,
    ],

    category: "mobile-devices",
    categoryName: "Mobile Devices",
    subCategory: "Feature Phones",
    familyName: "Classic Phones",
    family: "classic-phones",

    series: "HMD",
    model: "101",

    connectivityOptions: ["2G"],
    colorOptions: ["Grey", "Teal"],

    variants: [
      {
        color: "Grey",
        colorSlug: "grey",
        sku: "HMD-101-GREY",
        image: `${GALLERY_BASE}/101/Grey/HMD_101-Grey-FrontBack-Int.avif`,
        gallery: [
          `${GALLERY_BASE}/101/Grey/HMD_101-Grey-FrontBack-Int.avif`,
          `${GALLERY_BASE}/101/Grey/HMD_101-Grey-Front-Int.avif`,
          `${GALLERY_BASE}/101/Grey/HMD_101-Grey-Back-Int.avif`,
        ],
      },
      {
        color: "Teal",
        colorSlug: "teal",
        sku: "HMD-101-TEAL",
        image: `${GALLERY_BASE}/101/Teal/HMD_101-Teal-FrontBack-Int.avif`,
        gallery: [
          `${GALLERY_BASE}/101/Teal/HMD_101-Teal-FrontBack-Int.avif`,
          `${GALLERY_BASE}/101/Teal/HMD_101-Teal-Front-Int.avif`,
          `${GALLERY_BASE}/101/Teal/HMD_101-Teal-Back-Int.avif`,
        ],
      },
    ],

    tags: ["HMD", "101", "Feature Phones", "Classic Phones"],

    shortDescription:
      "HMD 101 feature phone with essential connectivity, music playback and expandable storage.",

    description:
      "Explore the HMD 101. Select a colour to view the matching official product gallery and key specifications.",

    specifications: {
      display: "1.77-inch QQVGA",
      processor: "Unisoc 6533G",
      memory: "4MB ROM / 4MB RAM",
      expandableStorage: "microSD up to 32GB",
      battery: "1000mAh",
      connectivity: "2G, Micro-USB, 3.5mm audio jack",
      audio: "MP3 player and FM radio",
      operatingSystem: "S30+",
      games: "Snake",
    },

    specificationSource: "Internal HMD/Nokia portfolio document",
    availability: "Available on Request",
    warranty: "Official",
    isFeatured: true,
    isNewArrival: true,
    isTrending: true,
    createdAt: "2026-07-19",
  },

  {
    id: "hmd-102",
    sku: "HMD-102",
    slug: "hmd-102",
    name: "HMD 102",
    shortName: "102",

    brand: "HMD",
    brandSlug: "hmd",

    image: `${GALLERY_BASE}/102/Blue/HMD_102-Blue-FrontBack.avif`,
    gallery: [
      `${GALLERY_BASE}/102/Blue/HMD_102-Blue-FrontBack.avif`,
      `${GALLERY_BASE}/102/Blue/HMD_102-Blue-Front.avif`,
      `${GALLERY_BASE}/102/Blue/HMD_102-Blue-Back.avif`,
    ],

    category: "mobile-devices",
    categoryName: "Mobile Devices",
    subCategory: "Feature Phones",
    familyName: "Classic Phones",
    family: "classic-phones",

    series: "HMD",
    model: "102",

    connectivityOptions: ["2G"],
    colorOptions: ["Blue", "Grey", "Red"],

    variants: [
      {
        color: "Blue",
        colorSlug: "blue",
        sku: "HMD-102-BLUE",
        image: `${GALLERY_BASE}/102/Blue/HMD_102-Blue-FrontBack.avif`,
        gallery: [
          `${GALLERY_BASE}/102/Blue/HMD_102-Blue-FrontBack.avif`,
          `${GALLERY_BASE}/102/Blue/HMD_102-Blue-Front.avif`,
          `${GALLERY_BASE}/102/Blue/HMD_102-Blue-Back.avif`,
        ],
      },
      {
        color: "Grey",
        colorSlug: "grey",
        sku: "HMD-102-GREY",
        image: `${GALLERY_BASE}/102/Grey/HMD_102-Grey-FrontBack.avif`,
        gallery: [
          `${GALLERY_BASE}/102/Grey/HMD_102-Grey-FrontBack.avif`,
          `${GALLERY_BASE}/102/Grey/HMD_102-Grey-Front.avif`,
          `${GALLERY_BASE}/102/Grey/HMD_102-Grey-Back.avif`,
        ],
      },
      {
        color: "Red",
        colorSlug: "red",
        sku: "HMD-102-RED",
        image: `${GALLERY_BASE}/102/Red/HMD_102-Red-FrontBack.avif`,
        gallery: [
          `${GALLERY_BASE}/102/Red/HMD_102-Red-FrontBack.avif`,
          `${GALLERY_BASE}/102/Red/HMD_102-Red-Front.avif`,
          `${GALLERY_BASE}/102/Red/HMD_102-Red-Back.avif`,
        ],
      },
    ],

    tags: ["HMD", "102", "Feature Phones", "Classic Phones"],

    shortDescription:
      "HMD 102 feature phone with a built-in camera, music support and dependable battery life.",

    description:
      "Explore the HMD 102. Select a colour to view the matching official product gallery and key specifications.",

    specifications: {
      display: "1.77-inch QQVGA",
      processor: "Unisoc 6533G",
      memory: "4MB ROM / 4MB RAM",
      expandableStorage: "microSD up to 32GB",
      rearCamera: "QVGA camera with flash",
      battery: "1000mAh",
      connectivity: "2G, Micro-USB, 3.5mm audio jack",
      audio: "FM radio and MP3 player",
      operatingSystem: "S30+",
      games: "Snake",
    },

    specificationSource: "Internal HMD/Nokia portfolio document",
    availability: "Available on Request",
    warranty: "Official",
    isFeatured: true,
    isNewArrival: true,
    isTrending: true,
    createdAt: "2026-07-19",
  },

  {
    id: "nokia-110-power",
    sku: "NOKIA-110-POWER",
    slug: "nokia-110-power",
    name: "Nokia 110 Power",
    shortName: "110 Power",

    brand: "Nokia",
    brandSlug: "nokia",

    image: `${GALLERY_BASE}/110/Blue/Nokia_110_Power-Blue-FrontBack.avif`,
    gallery: [
      `${GALLERY_BASE}/110/Blue/Nokia_110_Power-Blue-FrontBack.avif`,
      `${GALLERY_BASE}/110/Blue/Nokia_110_Power-Blue-Front.avif`,
      `${GALLERY_BASE}/110/Blue/Nokia_110_Power-Blue-Back.avif`,
    ],

    category: "mobile-devices",
    categoryName: "Mobile Devices",
    subCategory: "Feature Phones",
    familyName: "Classic Phones",
    family: "classic-phones",

    series: "Nokia",
    model: "110 Power",

    connectivityOptions: ["2G"],
    colorOptions: ["Blue", "Grey", "Light Purple"],

    variants: [
      {
        color: "Blue",
        colorSlug: "blue",
        sku: "NOKIA-110-POWER-BLUE",
        image: `${GALLERY_BASE}/110/Blue/Nokia_110_Power-Blue-FrontBack.avif`,
        gallery: [
          `${GALLERY_BASE}/110/Blue/Nokia_110_Power-Blue-FrontBack.avif`,
          `${GALLERY_BASE}/110/Blue/Nokia_110_Power-Blue-Front.avif`,
          `${GALLERY_BASE}/110/Blue/Nokia_110_Power-Blue-Back.avif`,
        ],
      },
      {
        color: "Grey",
        colorSlug: "grey",
        sku: "NOKIA-110-POWER-GREY",
        image: `${GALLERY_BASE}/110/Grey/Nokia_110_Power-Grey-FrontBack.avif`,
        gallery: [
          `${GALLERY_BASE}/110/Grey/Nokia_110_Power-Grey-FrontBack.avif`,
          `${GALLERY_BASE}/110/Grey/Nokia_110_Power-Grey-Front_.avif`,
          `${GALLERY_BASE}/110/Grey/Nokia_110_Power-Grey-Back_.avif`,
        ],
      },
      {
        color: "Light Purple",
        colorSlug: "light-purple",
        sku: "NOKIA-110-POWER-LIGHT-PURPLE",
        image: `${GALLERY_BASE}/110/Purple/Nokia_110_Power-Light_Purple-FrontBack.avif`,
        gallery: [
          `${GALLERY_BASE}/110/Purple/Nokia_110_Power-Light_Purple-FrontBack.avif`,
          `${GALLERY_BASE}/110/Purple/Nokia_110_Power-Light_Purple-Front_.avif`,
          `${GALLERY_BASE}/110/Purple/Nokia_110_Power-Light_Purple-Back_.avif`,
        ],
      },
    ],

    tags: [
      "Nokia",
      "110 Power",
      "Feature Phones",
      "Classic Phones",
      "Long Battery Life",
    ],

    shortDescription:
      "Nokia 110 Power feature phone with a large battery, camera and expandable music storage.",

    description:
      "Explore the Nokia 110 Power. Select a colour to view the matching official product gallery and key specifications.",

    specifications: {
      display: "2.0-inch QQVGA",
      processor: "Unisoc 6533G",
      memory: "4MB ROM / 4MB RAM",
      expandableStorage: "microSD up to 32GB",
      rearCamera: "QVGA camera with flash",
      battery: "1750mAh",
      connectivity: "2G, Micro-USB, 3.5mm audio jack",
      audio: "FM radio",
      operatingSystem: "S30+",
      games: "Snake",
    },

    specificationSource: "Internal HMD/Nokia portfolio document",
    availability: "Available on Request",
    warranty: "Official",
    isFeatured: true,
    isNewArrival: true,
    isTrending: true,
    createdAt: "2026-08-22",
  },

  {
    id: "nokia-110-4g-2024",
    sku: "NOKIA-110-4G-2024",
    slug: "nokia-110-4g-2024",
    name: "Nokia 110 4G (2024)",
    shortName: "110 4G",

    brand: "Nokia",
    brandSlug: "nokia",

    // The supplied media folder is named "125"; paths intentionally follow it exactly.
    image: `${GALLERY_BASE}/125/Blue/Nokia_110_4G-Blue-FrontBack-Int.avif`,
    gallery: [
      `${GALLERY_BASE}/125/Blue/Nokia_110_4G-Blue-FrontBack-Int.avif`,
      `${GALLERY_BASE}/125/Blue/Nokia_110_4G-Blue-Front-Int.avif`,
      `${GALLERY_BASE}/125/Blue/Nokia_110_4G-Blue-Back-Int.avif`,
    ],

    category: "mobile-devices",
    categoryName: "Mobile Devices",
    subCategory: "Feature Phones",
    familyName: "4G Feature Phones",
    family: "4g-feature-phones",

    series: "Nokia",
    model: "110 4G (2024)",

    connectivityOptions: ["4G"],
    colorOptions: ["Blue", "Titanium"],

    variants: [
      {
        color: "Blue",
        colorSlug: "blue",
        sku: "NOKIA-110-4G-2024-BLUE",
        image: `${GALLERY_BASE}/125/Blue/Nokia_110_4G-Blue-FrontBack-Int.avif`,
        gallery: [
          `${GALLERY_BASE}/125/Blue/Nokia_110_4G-Blue-FrontBack-Int.avif`,
          `${GALLERY_BASE}/125/Blue/Nokia_110_4G-Blue-Front-Int.avif`,
          `${GALLERY_BASE}/125/Blue/Nokia_110_4G-Blue-Back-Int.avif`,
        ],
      },
      {
        color: "Titanium",
        colorSlug: "titanium",
        sku: "NOKIA-110-4G-2024-TITANIUM",
        image: `${GALLERY_BASE}/125/Titanium/Nokia_110_4G-Titanium-FrontBack-Int.avif`,
        gallery: [
          `${GALLERY_BASE}/125/Titanium/Nokia_110_4G-Titanium-FrontBack-Int.avif`,
          `${GALLERY_BASE}/125/Titanium/Nokia_110_4G-Titanium-Front-Int.avif`,
          `${GALLERY_BASE}/125/Titanium/Nokia_110_4G-Titanium-Back-Int.avif`,
        ],
      },
    ],

    tags: [
      "Nokia",
      "110 4G",
      "Feature Phones",
      "4G Feature Phones",
      "HD Calling",
    ],

    shortDescription:
      "Nokia 110 4G feature phone with HD calling, removable battery and everyday essentials.",

    description:
      "Explore the Nokia 110 4G (2024). Select a colour to view the matching official product gallery and key specifications.",

    specifications: {
      display: "2.0-inch QVGA",
      memory: "128MB RAM, 64MB internal storage",
      expandableStorage: "microSD supported",
      battery: "1000mAh removable",
      connectivity: "4G LTE, Bluetooth, USB Type-C, 3.5mm audio jack",
      audio: "HD voice calling and FM radio",
    },

    specificationSource: "Internal HMD/Nokia portfolio document",
    availability: "Available on Request",
    warranty: "Official",
    isFeatured: true,
    isNewArrival: true,
    isTrending: true,
    createdAt: "2026-08-22",
  },
];

export { newPhoneProducts };
export default newPhoneProducts;
